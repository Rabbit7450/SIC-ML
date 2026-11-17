import { and, desc, inArray, isNull } from "drizzle-orm";
import { Topbar } from "@/components/layout/topbar";
import { PhishingPanel } from "@/components/phishing/phishing-panel";
import { getAppRole } from "@/lib/current-role";
import { canWrite } from "@/lib/roles";
import { getDb, scans } from "@/lib/db";
import { DataState } from "@/components/layout/data-state";
import type { PhishingHistoryItem, PhishingVerdict } from "@/lib/phishing";

type Finding = {
  method?: string;
  score?: number;
  verdict?: PhishingVerdict;
  source?: "blocklist" | "model" | "none";
  model_score?: number | null;
  blocklist_match?: string | null;
  features?: Record<string, number>;
};

export default async function PhishingPage() {
  const { role } = await getAppRole();
  let history: PhishingHistoryItem[] = [];
  let state: "demo" | "connected" | "error" = "connected";
  try {
    const records = await getDb()
      .select()
      .from(scans)
      .where(and(isNull(scans.deleted_at), inArray(scans.scan_type, ["phishing-ml", "phishing-heuristic"])))
      .orderBy(desc(scans.created_at))
      .limit(12);
    history = records.map((scan) => {
      const f = (Array.isArray(scan.findings) ? scan.findings[0] : undefined) as Finding | undefined;
      const base = {
        id: scan.id,
        created_at: scan.created_at.toISOString(),
        url: scan.target_url,
        features: f?.features ?? {},
        blocklist_match: f?.blocklist_match ?? null,
        model_score: f?.model_score ?? null,
        notes: [] as string[],
      };
      if (scan.scan_type === "phishing-ml") {
        return {
          ...base,
          verdict: f?.verdict ?? (scan.risk_level === "alto" ? "phish" : "legit"),
          score: typeof f?.score === "number" ? f.score : null,
          source: f?.source ?? "none",
        } satisfies PhishingHistoryItem;
      }
      return {
        ...base,
        verdict: scan.risk_level === "alto" || scan.risk_level === "phish" ? "phish" : "legit",
        score: typeof f?.score === "number" ? f.score : null,
        source: "model",
        notes: [`Método histórico: ${f?.method ?? "heuristic_v2"} (heurística local)`],
      } satisfies PhishingHistoryItem;
    });
  } catch {
    state = "error";
  }
  const writable = canWrite(role);
  return (
    <>
      <Topbar
        title="Phishing"
        subtitle={
          writable
            ? "Lista de phishing conocida + modelo ML sobre la URL · historial guardado en PostgreSQL"
            : "Historial de solo lectura"
        }
      />
      <div className="space-y-6 p-6">
        <DataState state={state} />
        <PhishingPanel initialHistory={history} canWrite={writable && state !== "error"} />
      </div>
    </>
  );
}


