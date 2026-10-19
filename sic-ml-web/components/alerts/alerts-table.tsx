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

export function AlertsTable({ alerts }: { alerts: AlertRow[] }) {
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
        title="Sin alertas en el bosque"
        description="Cuando Suricata, IoT o phishing publiquen eventos, aparecerán aquí con soft delete."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {["all", "critica", "alta", "media", "baja"].map((s) => (
          <Button
            key={s}
            size="sm"
            variant={severity === s ? "default" : "outline"}
            onClick={() => setSeverity(s)}
          >
            {s}
          </Button>
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-background-elevated text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3">Alerta</th>
              <th className="px-4 py-3">Módulo</th>
              <th className="px-4 py-3">Severidad</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((alert) => (
              <tr
                key={alert.id}
                className="border-t border-border/70 hover:bg-primary/5"
              >
                <td className="px-4 py-3">
                  <p className="font-medium">{alert.title}</p>
                  <p className="text-xs text-muted">
                    {alert.attack_type} · {alert.source_ip ?? "—"}
                  </p>
                </td>
                <td className="px-4 py-3 capitalize">{alert.module}</td>
                <td className="px-4 py-3">
                  <Badge className={severityClass(alert.severity)}>
                    {alert.severity}
                  </Badge>
                </td>
                <td className="px-4 py-3 font-mono text-xs">
                  {alert.score?.toFixed(2) ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy === alert.id}
                      onClick={() => mutate(alert.id, "soft_delete")}
                    >
                      Baja lógica
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={busy === alert.id}
                      onClick={() => mutate(alert.id, "hard_delete")}
                    >
                      Baja física
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
