"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { severityClass } from "@/lib/utils";

type AlertRow = {
  id: string;
  title: string;
  module: string;
  attack_type: string | null;
  severity: string;
  score: number | null;
  source_ip: string | null;
};

export function AlertsTable({
  alerts,
  canWrite = true,
  canHardDelete = false,
}: {
  alerts: AlertRow[];
  canWrite?: boolean;
  canHardDelete?: boolean;
}) {
  const router = useRouter();
  const [severity, setSeverity] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      severity === "all"
        ? alerts
        : alerts.filter((a) => a.severity === severity),
    [alerts, severity],
  );

  async function mutate(id: string, action: "soft_delete" | "hard_delete") {
    if (action === "hard_delete") {
      const ok = window.confirm(
        "¿Baja física permanente? Solo admin. Esta acción no se puede deshacer.",
      );
      if (!ok) return;
    }
    setBusy(id);
    const res = await fetch("/api/soft-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "alerts", id, action }),
    });
    setBusy(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Error al actualizar");
      return;
    }
    router.refresh();
  }

  if (!alerts.length) {
    return (
      <EmptyState
        title="Sin alertas activas"
        description="Cuando Suricata, IoT o phishing publiquen eventos, aparecerán aquí. Las archivadas usan baja lógica (soft delete)."
      />
    );
  }

  const filters: Array<{ value: string; label: string }> = [
    { value: "all", label: "Todas" },
    { value: "critica", label: "Crítica" },
    { value: "alta", label: "Alta" },
    { value: "media", label: "Media" },
    { value: "baja", label: "Baja" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por severidad">
        {filters.map((s) => (
          <Button
            key={s.value}
            size="sm"
            variant={severity === s.value ? "default" : "outline"}
            aria-pressed={severity === s.value}
            onClick={() => setSeverity(s.value)}
          >
            {s.label}
          </Button>
        ))}
      </div>
      <div className="overflow-x-auto overflow-y-hidden rounded-2xl border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-background-elevated text-xs uppercase tracking-wider text-muted">
            <tr>
              <th scope="col" className="px-4 py-3">Alerta</th>
              <th scope="col" className="px-4 py-3">Módulo</th>
              <th scope="col" className="px-4 py-3">Severidad</th>
              <th scope="col" className="px-4 py-3">Score</th>
              {canWrite || canHardDelete ? (
                <th scope="col" className="px-4 py-3">Acciones</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {filtered.map((alert) => (
              <tr
                key={alert.id}
                className="border-t border-border/70 hover:bg-primary/5"
              >
                <td className="min-w-0 max-w-md px-4 py-3">
                  <p className="truncate font-medium" title={alert.title}>{alert.title}</p>
                  <p className="text-xs text-muted">
                    {alert.attack_type ?? "—"} · {alert.source_ip ?? "—"}
                  </p>
                </td>
                <td className="px-4 py-3 capitalize">{alert.module}</td>
                <td className="px-4 py-3">
                  <Badge className={severityClass(alert.severity)}>
                    {alert.severity}
                  </Badge>
                </td>
                <td className="px-4 py-3 font-mono text-xs tabular-nums">
                  {alert.score?.toFixed(2) ?? "—"}
                </td>
                {canWrite || canHardDelete ? (
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {canWrite ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busy === alert.id}
                          onClick={() => mutate(alert.id, "soft_delete")}
                        >
                          Baja lógica
                        </Button>
                      ) : null}
                      {canHardDelete ? (
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={busy === alert.id}
                          onClick={() => mutate(alert.id, "hard_delete")}
                        >
                          Baja física
                        </Button>
                      ) : null}
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
