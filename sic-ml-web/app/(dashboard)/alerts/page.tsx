import { desc, isNull } from "drizzle-orm";
import { Topbar } from "@/components/layout/topbar";
import { AlertsTable } from "@/components/alerts/alerts-table";
import { getAppRole } from "@/lib/current-role";
import { demoAlerts } from "@/lib/demo-data";
import { canHardDelete, canWrite } from "@/lib/roles";
import { DataState } from "@/components/layout/data-state";
import { getDb, alerts as alertsTable } from "@/lib/db";

export default async function AlertsPage() {
  const connected = Boolean(process.env.DATABASE_URL);
  let alerts = connected ? [] : demoAlerts;
  let state: "demo" | "connected" | "error" = connected ? "connected" : "demo";
  if (connected) try {
    const rows = await getDb()
      .select()
      .from(alertsTable)
      .where(isNull(alertsTable.deleted_at))
      .orderBy(desc(alertsTable.created_at));
    alerts = rows as unknown as typeof demoAlerts;
  } catch {
    state = "error";
  }

  const { role } = await getAppRole();

  return (
    <>
      <Topbar
        title="Alertas IDS"
        subtitle={
          canHardDelete(role)
            ? "Baja lógica para el equipo · baja física solo admin"
            : canWrite(role)
              ? "Puedes archivar con baja lógica"
              : "Consulta de solo lectura"
        }
      />
      <div className="space-y-4 overflow-x-auto p-6">
        <DataState state={state} />
        {state === "error" ? null : <AlertsTable
          alerts={alerts}
          canWrite={canWrite(role)}
          canHardDelete={canHardDelete(role)}
        />}
      </div>
    </>
  );
}
