import { AccessDenied } from "@/components/layout/access-denied";
import { Topbar } from "@/components/layout/topbar";
import { AuditPanel, type AuditLogItem } from "@/components/audit/audit-panel";
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

  const serialized: AuditLogItem[] = logs.map((l) => ({
    ...l,
    created_at: new Date(l.created_at).toISOString(),
  }));

  return (
    <>
      <Topbar
        title="Auditoría"
        subtitle="Altas, bajas lógicas y bajas físicas"
      />
      <div className="space-y-4 p-6">
        <DataState state={state} />
        {state === "error" ? null : <AuditPanel logs={serialized} />}
      </div>
    </>
  );
}
