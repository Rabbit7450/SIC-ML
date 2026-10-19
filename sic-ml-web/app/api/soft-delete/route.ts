import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { markRestored, markSoftDeleted } from "@/lib/soft-delete";

const bodySchema = z.object({
  table: z.enum(["devices", "alerts", "scans", "models", "reports", "profiles"]),
  id: z.string().uuid(),
  action: z.enum(["soft_delete", "restore", "hard_delete"]),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "payload inválido" }, { status: 400 });
  }

  const { table, id, action } = parsed.data;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "no autenticado" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  const role = profile?.role ?? "viewer";

  if (action === "hard_delete") {
    if (role !== "admin") {
      return NextResponse.json(
        { error: "solo admin puede hacer baja física" },
        { status: 403 },
      );
    }
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      action: "hard_delete",
      entity_table: table,
      entity_id: id,
    });
    return NextResponse.json({ ok: true, action });
  }

  if (role === "viewer") {
    return NextResponse.json({ error: "sin permisos" }, { status: 403 });
  }

  const patch = action === "soft_delete" ? markSoftDeleted() : markRestored();
  const { error } = await supabase.from(table).update(patch).eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action,
    entity_table: table,
    entity_id: id,
  });

  return NextResponse.json({ ok: true, action });
}
