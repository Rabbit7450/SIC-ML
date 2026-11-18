"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 5;

export type AuditLogItem = {
  id: string;
  action: string;
  entity_table: string;
  entity_id: string | null;
  created_at: string;
  actor_email: string | null;
  details: Record<string, unknown>;
};

function LogRow({ log }: { log: AuditLogItem }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
      <span>
        <span className="text-primary">{log.action === "login" ? "inicio de sesión" : log.action}</span> en{" "}
        <span className="font-mono">{log.entity_table}</span>
        {log.actor_email ? <span className="ml-2 text-xs text-muted">por {log.actor_email}</span> : null}
      </span>
      <time className="text-xs text-muted">{new Date(log.created_at).toLocaleString("es-BO")}</time>
    </li>
  );
}

/** Panel de auditoría con las dos listas paginadas (5 por página). */
export function AuditPanel({ logs }: { logs: AuditLogItem[] }) {
  const [trailPage, setTrailPage] = useState(1);
  const [loginPage, setLoginPage] = useState(1);

  const logins = logs.filter((l) => l.action === "login");
  const trail = logs;
  const visibleTrail = trail.slice((trailPage - 1) * PAGE_SIZE, trailPage * PAGE_SIZE);
  const visibleLogins = logins.slice((loginPage - 1) * PAGE_SIZE, loginPage * PAGE_SIZE);

  /** Descarga el trail de auditoría completo como Excel (.xlsx). */
  async function downloadExcel() {
    if (!trail.length) return;
    const XLSX = await import("xlsx");
    const rows = trail.map((l) => ({
      ID: l.id,
      Acción: l.action,
      Tabla: l.entity_table,
      "ID entidad": l.entity_id ?? "",
      Actor: l.actor_email ?? "",
      Fecha: new Date(l.created_at).toLocaleString("es-BO"),
      Detalles: JSON.stringify(l.details ?? {}),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 36 }, { wch: 22 }, { wch: 14 }, { wch: 36 }, { wch: 28 }, { wch: 22 }, { wch: 60 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Auditoría");
    XLSX.writeFile(wb, `auditoria-sicml-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  if (!logs.length) {
    return (
      <EmptyState
        title="Sin eventos de auditoría"
        description="Cuando crees, restaures o borres registros, el trail aparecerá aquí."
      />
    );
  }

  return (
    <div className="space-y-4">
      {logins.length ? (
        <Card>
          <div className="flex items-baseline justify-between gap-3 border-b border-border pb-3">
            <div>
              <h2 className="font-display text-lg">Ingresos de usuarios</h2>
              <p className="mt-1 text-sm text-muted">Sesiones validadas con contraseña local.</p>
            </div>
            <span className="text-xs text-muted">{logins.length} recientes</span>
          </div>
          <ul className="divide-y divide-border">
            {visibleLogins.map((log) => (
              <li key={log.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <span>
                  <span className="font-medium">{log.actor_email ?? "Usuario eliminado"}</span>
                  <span className="ml-2 text-muted">Ingreso con contraseña</span>
                </span>
                <time className="text-xs text-muted">{new Date(log.created_at).toLocaleString("es-BO")}</time>
              </li>
            ))}
          </ul>
          <Pagination page={loginPage} pageSize={PAGE_SIZE} total={logins.length} onPage={setLoginPage} />
        </Card>
      ) : null}

      <Card>
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="font-display text-lg">Trail de cambios</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void downloadExcel()}
            disabled={!trail.length}
            aria-label="Descargar auditoría en formato Excel"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Excel (.xlsx)
          </Button>
        </div>
        <ul className="divide-y divide-border">
          {visibleTrail.map((log) => (
            <LogRow key={log.id} log={log} />
          ))}
        </ul>
        <Pagination page={trailPage} pageSize={PAGE_SIZE} total={trail.length} onPage={setTrailPage} />
      </Card>
    </div>
  );
}
