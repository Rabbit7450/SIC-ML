import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { canWrite, isAppRole } from "@/lib/roles";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  node_id: z.string().trim().min(2).max(100),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Nombre y node_id son requeridos." }, { status: 400 });
  }

  try {
    const id = (await cookies()).get("sic_user")?.value;
    if (!id) return NextResponse.json({ error: "Inicia sesión para registrar nodos." }, { status: 401 });
    const profiles = await getDb().execute(sql`SELECT role FROM profiles WHERE id = ${id}::uuid AND deleted_at IS NULL LIMIT 1`);
    const role = (profiles[0] as { role?: string } | undefined)?.role;
    if (!isAppRole(role) || !canWrite(role)) return NextResponse.json({ error: "Tu rol no puede registrar dispositivos." }, { status: 403 });

    const rows = await getDb().execute(sql`INSERT INTO devices (name, node_id, status, owner_id) VALUES (${parsed.data.name}, ${parsed.data.node_id}, 'unknown', ${id}::uuid) RETURNING id, name, node_id, status, last_seen_at`);
    const device = rows[0];
    await getDb().execute(sql`INSERT INTO audit_logs (actor_id, action, entity_table, entity_id, details) VALUES (${id}::uuid, 'create', 'devices', ${(device as { id: string }).id}::uuid, jsonb_build_object('node_id', ${parsed.data.node_id}::text))`);
    return NextResponse.json({ ok: true, device }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "No se pudo crear el dispositivo (¿node_id duplicado?)." }, { status: 400 });
  }
}

