import { AccessDenied } from "@/components/layout/access-denied";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { getAppRole } from "@/lib/current-role";
import { canWrite } from "@/lib/roles";
import { DataState } from "@/components/layout/data-state";

export default async function AuditPage() {
  let logs: Array<{
    id: string;
    action: string;
    entity_table: string;
    entity_id: string | null;
    created_at: Date;
    actor_email: string | null;
    details: Record<string, unknown>;
  }> = [];

  let state: "demo" | "connected" | "error" = "connected";
  try {
    logs = await getDb().execute(sql`
      SELECT a.id, a.action, a.entity_table, a.entity_id, a.created_at,
             p.email AS actor_email, a.details
      FROM audit_logs a
      LEFT JOIN profiles p ON p.id = a.actor_id
      WHERE a.deleted_at IS NULL
      ORDER BY a.created_at DESC
      LIMIT 50
    `) as unknown as typeof logs;
  } catch {
    state = "error";
  }

  const { role } = await getAppRole();
  if (!canWrite(role)) {
    return (
      <AccessDenied
        title="Auditoría"
        description="El registro de cambios está reservado a analistas y administradores."
      />
    );
  }

  return (
    <>
      <Topbar
        title="Auditoría"
        subtitle="Altas, bajas lógicas y bajas físicas"
      />
      <div className="space-y-4 p-6">
        <DataState state={state} />
        {logs.filter((log) => log.action === "login").length ? (
          <Card>
            <div className="flex items-baseline justify-between gap-3 border-b border-border pb-3">
              <div><h2 className="font-display text-lg">Ingresos de usuarios</h2><p className="mt-1 text-sm text-muted">Sesiones validadas con contraseña local.</p></div>
              <span className="text-xs text-muted">{logs.filter((log) => log.action === "login").length} recientes</span>
            </div>
            <ul className="divide-y divide-border">
              {logs.filter((log) => log.action === "login").map((log) => (
                <li key={log.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <span><span className="font-medium">{log.actor_email ?? "Usuario eliminado"}</span><span className="ml-2 text-muted">Ingreso con contraseña</span></span>
                  <time className="text-xs text-muted">{new Date(log.created_at).toLocaleString("es-BO")}</time>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
        {!logs.length && state !== "error" ? (
          <EmptyState
            title="Sin eventos de auditoría"
            description="Cuando crees, restaures o borres registros, el trail aparecerá aquí."
          />
        ) : logs.length ? (
          <Card>
            <ul className="divide-y divide-border">
              {logs.map((log) => (
                <li
                  key={log.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                >
                  <span>
                    <span className="text-primary">{log.action === "login" ? "inicio de sesión" : log.action}</span> en{" "}
                    <span className="font-mono">{log.entity_table}</span>
                    {log.actor_email ? <span className="ml-2 text-xs text-muted">por {log.actor_email}</span> : null}
                  </span>
                  <span className="text-xs text-muted">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>
    </>
  );
}
