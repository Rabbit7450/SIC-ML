import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, alerts, devices, models, profiles, reports, scans } from "@/lib/db";
import { markRestored, markSoftDeleted } from "@/lib/soft-delete";
import { canWrite, isAppRole } from "@/lib/roles";

const bodySchema = z.object({
  table: z.enum(["devices", "alerts", "scans", "models", "reports", "profiles"]),
  id: z.string().uuid(),
  action: z.enum(["soft_delete", "restore", "hard_delete"]),
});

const TABLES = { devices, alerts, scans, models, reports, profiles } as const;

async function sessionRole() {
  const id = (await cookies()).get("sic_user")?.value;
  if (!id) return { id: null, role: undefined };
  const rows = await getDb().execute(sql`SELECT id, role FROM profiles WHERE id = ${id}::uuid AND deleted_at IS NULL LIMIT 1`);
  const profile = rows[0] as { id: string; role?: string } | undefined;
  return { id: profile?.id ?? null, role: profile?.role };
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "payload inválido" }, { status: 400 });
  }

  const { table, id, action } = parsed.data;

  let session: { id: string | null; role: string | undefined };
  try {
    session = await sessionRole();
  } catch {
    return NextResponse.json({ error: "No se pudo verificar la sesión con PostgreSQL." }, { status: 503 });
  }
  if (!session.id) {
    return NextResponse.json({ error: "no autenticado" }, { status: 401 });
  }
  const role = isAppRole(session.role) ? session.role : "viewer";

  const db = getDb();
  const target = TABLES[table];

  if (action === "hard_delete") {
    if (role !== "admin") {
      return NextResponse.json({ error: "solo admin puede hacer baja física" }, { status: 403 });
    }
    await db.delete(target).where(eq(target.id, id));
    await db.execute(sql`INSERT INTO audit_logs (actor_id, action, entity_table, entity_id) VALUES (${session.id}::uuid, 'hard_delete', ${table}, ${id}::uuid)`);
    return NextResponse.json({ ok: true, action });
  }

  if (!canWrite(role)) {
    return NextResponse.json({ error: "sin permisos" }, { status: 403 });
  }

  const patch = action === "soft_delete" ? markSoftDeleted() : markRestored();
  await db.update(target).set(patch).where(eq(target.id, id));
  await db.execute(sql`INSERT INTO audit_logs (actor_id, action, entity_table, entity_id) VALUES (${session.id}::uuid, ${action}, ${table}, ${id}::uuid)`);

  return NextResponse.json({ ok: true, action });
}

