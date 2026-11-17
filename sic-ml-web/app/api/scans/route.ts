import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { analyzeUrl } from "@/lib/phishing/heuristic";
import { getDb } from "@/lib/db";
import { canWrite, isAppRole } from "@/lib/roles";

const schema = z.object({ target_url: z.string().trim().min(4).max(2048) });
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Introduce una URL válida." }, { status: 400 });
  let analysis; try { analysis = analyzeUrl(parsed.data.target_url); } catch { return NextResponse.json({ error: "La URL debe usar HTTP o HTTPS y tener un host válido." }, { status: 400 }); }
  try {
    const id = (await cookies()).get("sic_user")?.value;
    if (!id) return NextResponse.json({ error: "Inicia sesión para registrar análisis." }, { status: 401 });
    const profiles = await getDb().execute(sql`SELECT role FROM profiles WHERE id = ${id}::uuid AND deleted_at IS NULL`);
    const profile = profiles[0] as { role?: string } | undefined;
    if (!isAppRole(profile?.role) || !canWrite(profile.role)) return NextResponse.json({ error: "Tu rol no puede registrar análisis." }, { status: 403 });
    const rows = await getDb().execute(sql`INSERT INTO scans (target_url, scan_type, status, risk_level, findings, created_by) VALUES (${analysis.url}, 'phishing-heuristic', 'completed', ${analysis.label}, ${JSON.stringify([{ method: analysis.method, score: analysis.score }])}::jsonb, ${id}::uuid) RETURNING id, created_at`);
    const scan = rows[0] as { id: string; created_at: string };
    await getDb().execute(sql`INSERT INTO audit_logs (actor_id, action, entity_table, entity_id, details) VALUES (${id}::uuid, 'phishing_scan', 'scans', ${scan.id}::uuid, jsonb_build_object('url', ${analysis.url}::text, 'score', ${analysis.score}::float8))`);
    return NextResponse.json({ ...analysis, ...scan });
  } catch (err) {
    console.error("[api/scans] error al guardar:", err);
    return NextResponse.json(
      { error: "No se pudo guardar el análisis en PostgreSQL.", detail: err instanceof Error ? err.message : String(err) },
      { status: 503 },
    );
  }
}
