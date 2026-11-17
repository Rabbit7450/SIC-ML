import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { canWrite, isAppRole } from "@/lib/roles";

const schema = z.object({
  title: z.string().trim().min(3).max(120),
  summary: z.string().trim().max(3000).default(""),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Revisa el título y el resumen del informe." }, { status: 400 });

  try {
    const id = (await cookies()).get("sic_user")?.value;
    if (!id) return NextResponse.json({ error: "Inicia sesión para crear un informe." }, { status: 401 });
    const profiles = await getDb().execute(sql`SELECT role FROM profiles WHERE id = ${id}::uuid AND deleted_at IS NULL LIMIT 1`);
    const role = (profiles[0] as { role?: string } | undefined)?.role;
    if (!isAppRole(role) || !canWrite(role)) {
      return NextResponse.json({ error: "Tu rol no puede crear informes." }, { status: 403 });
    }

    const rows = await getDb().execute(sql`INSERT INTO reports (title, report_type, summary, content, created_by) VALUES (${parsed.data.title}, 'security-summary', ${parsed.data.summary}, jsonb_build_object('created_from', 'sic-ml-web'), ${id}::uuid) RETURNING id, title, report_type, summary, created_at`);
    const report = rows[0];
    await getDb().execute(sql`INSERT INTO audit_logs (actor_id, action, entity_table, entity_id) VALUES (${id}::uuid, 'create', 'reports', ${(report as { id: string }).id}::uuid)`);
    return NextResponse.json({ report }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "No se pudo conectar con PostgreSQL." }, { status: 503 });
  }
}

