import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  name: z.string().min(2),
  node_id: z.string().min(2),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "datos inválidos" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "no autenticado" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("devices")
    .insert({
      name: parsed.data.name,
      node_id: parsed.data.node_id,
      status: "unknown",
      owner_id: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action: "create",
    entity_table: "devices",
    entity_id: data.id,
  });

  return NextResponse.json({ ok: true, device: data });
}
