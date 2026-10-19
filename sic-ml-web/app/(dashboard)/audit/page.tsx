import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";

export default async function AuditPage() {
  let logs: Array<{
    id: string;
    action: string;
    entity_table: string;
    entity_id: string | null;
    created_at: string;
  }> = [];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("audit_logs")
      .select("id, action, entity_table, entity_id, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(50);
    logs = data ?? [];
  } catch {
    /* empty */
  }

  return (
    <>
      <Topbar
        title="Auditoría"
        subtitle="Altas, bajas lógicas y bajas físicas"
      />
      <div className="p-6">
        {!logs.length ? (
          <EmptyState
            title="Sin eventos de auditoría"
            description="Cuando crees, restaures o borres registros, el trail aparecerá aquí."
          />
        ) : (
          <Card>
            <ul className="divide-y divide-border">
              {logs.map((log) => (
                <li
                  key={log.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                >
                  <span>
                    <span className="text-primary">{log.action}</span> en{" "}
                    <span className="font-mono">{log.entity_table}</span>
                  </span>
                  <span className="text-xs text-muted">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </>
  );
}
