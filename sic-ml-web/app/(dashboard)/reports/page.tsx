import { desc, isNull } from "drizzle-orm";
import { DataState } from "@/components/layout/data-state";
import { Topbar } from "@/components/layout/topbar";
import { ReportsPanel, type ReportRow } from "@/components/reports/reports-panel";
import { getAppRole } from "@/lib/current-role";
import { canWrite } from "@/lib/roles";
import { getDb, reports as reportsTable } from "@/lib/db";

export default async function ReportsPage() {
  const connected = Boolean(process.env.DATABASE_URL);
  let state: "demo" | "connected" | "error" = connected ? "connected" : "demo";
  let reports: ReportRow[] = [];
  if (connected) {
    try {
      const rows = await getDb()
        .select({ id: reportsTable.id, title: reportsTable.title, report_type: reportsTable.report_type, summary: reportsTable.summary, created_at: reportsTable.created_at })
        .from(reportsTable)
        .where(isNull(reportsTable.deleted_at))
        .orderBy(desc(reportsTable.created_at))
        .limit(50);
      reports = rows as unknown as ReportRow[];
    } catch {
      state = "error";
    }
  }

  const { role } = await getAppRole();
  return (
    <>
      <Topbar title="Informes" subtitle="Registro de análisis y hallazgos del equipo" />
      <div className="space-y-4 p-6">
        <DataState state={state} />
        <ReportsPanel reports={reports} canWrite={canWrite(role) && state !== "error"} demoMode={!connected} />
      </div>
    </>
  );
}
