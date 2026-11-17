import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { canWrite, isAppRole } from "@/lib/roles";
import type { PhishingCheck } from "@/lib/phishing";

export const dynamic = "force-dynamic";

const schema = z.object({ url: z.string().trim().min(3).max(2048) });

const RISK_BY_VERDICT: Record<string, string> = {
  phish: "alto",
  suspicious: "medio",
  legit: "bajo",
  unknown: "bajo",
};

/**
 * Único endpoint de análisis anti-phishing: consulta el servicio FastAPI
 * (`phishing/api.py`: blocklist + modelo ML) y guarda el veredicto en
 * PostgreSQL (`scans`, scan_type='phishing-ml') + auditoría.
 * Requiere sesión y rol con permiso de escritura.
 */
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Introduce una URL válida (entre 3 y 2048 caracteres)." }, { status: 400 });
  }

  const id = (await cookies()).get("sic_user")?.value;
  if (!id) {
    return NextResponse.json({ error: "Inicia sesión para analizar URLs." }, { status: 401 });
  }

  let role: string | undefined;
  try {
    const profiles = await getDb().execute(
      sql`SELECT role FROM profiles WHERE id = ${id}::uuid AND deleted_at IS NULL LIMIT 1`,
    );
    role = (profiles[0] as { role?: string } | undefined)?.role;
  } catch {
    return NextResponse.json({ error: "No se pudo verificar tu rol con la base de datos." }, { status: 503 });
  }
  if (!isAppRole(role) || !canWrite(role)) {
    return NextResponse.json({ error: "Tu rol no puede registrar análisis." }, { status: 403 });
  }

  const baseUrl = process.env.PHISHING_API_URL?.replace(/\/$/, "");
  if (!baseUrl) {
    return NextResponse.json(
      { error: "Servicio anti-phishing no configurado: define PHISHING_API_URL en el servidor." },
      { status: 503 },
    );
  }

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (process.env.PHISHING_API_KEY) headers["x-api-key"] = process.env.PHISHING_API_KEY;
    const response = await fetch(`${baseUrl}/check-url`, {
      method: "POST",
      headers,
      body: JSON.stringify({ url: parsed.data.url }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail =
        typeof (data as { detail?: unknown })?.detail === "string"
          ? (data as { detail: string }).detail
          : `El servicio anti-phishing respondió HTTP ${response.status}.`;
      return NextResponse.json({ error: detail }, { status: 502 });
    }

    const check = data as PhishingCheck;
    const risk = RISK_BY_VERDICT[check.verdict] ?? "bajo";
    const findings = [
      {
        method: "ml_blocklist_v1",
        source: check.source,
        verdict: check.verdict,
        score: check.score,
        model_score: check.model_score,
        blocklist_match: check.blocklist_match,
        features: check.features,
      },
    ];

    // Persistir en PostgreSQL; si falla, el veredicto igualmente se devuelve.
    let scanId: string | null = null;
    let scanCreatedAt: string | null = null;
    try {
      const rows = await getDb().execute(sql`
        INSERT INTO scans (target_url, scan_type, status, risk_level, findings, created_by)
        VALUES (${check.url}, 'phishing-ml', 'completed', ${risk}, ${JSON.stringify(findings)}::jsonb, ${id}::uuid)
        RETURNING id, created_at
      `);
      const scan = rows[0] as { id: string; created_at: Date | string } | undefined;
      if (scan) {
        scanId = scan.id;
        scanCreatedAt = scan.created_at instanceof Date ? scan.created_at.toISOString() : String(scan.created_at);
        await getDb().execute(sql`
          INSERT INTO audit_logs (actor_id, action, entity_table, entity_id, details)
          VALUES (${id}::uuid, 'phishing_scan_ml', 'scans', ${scan.id}::uuid,
                  jsonb_build_object('url', ${check.url}::text, 'verdict', ${check.verdict}::text, 'source', ${check.source}::text))
        `);
      }
    } catch (err) {
      console.error("[api/phishing] no se pudo guardar en scans:", err);
      check.notes = [...(check.notes ?? []), "El veredicto no se pudo guardar en PostgreSQL."];
    }

    return NextResponse.json({ ...check, id: scanId, created_at: scanCreatedAt });
  } catch {
    return NextResponse.json(
      { error: "No se pudo contactar el servicio anti-phishing. Levántalo con: uvicorn api:app --app-dir phishing --port 8089" },
      { status: 503 },
    );
  }
}
