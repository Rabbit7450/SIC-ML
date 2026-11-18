"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { severityClass } from "@/lib/utils";

const PAGE_SIZE = 5;

export type FeedAlert = {
  id: string;
  title: string;
  severity: string;
  module: string;
  attack_type: string | null;
};

/** Feed de alertas del dashboard, paginado (5 por página). */
export function AlertsFeed({ alerts }: { alerts: FeedAlert[] }) {
  const [page, setPage] = useState(1);
  const visible = alerts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Card className="h-full">
      <div className="mb-4 flex items-baseline justify-between">
        <p className="font-display text-lg">Feed de alertas</p>
        <span className="text-xs text-muted">{alerts.length} totales</span>
      </div>
      {alerts.length ? (
        <>
          <ul className="space-y-3">
            {visible.map((alert) => (
              <li
                key={alert.id}
                className="rounded-xl border border-border/80 bg-background-elevated/50 px-3 py-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{alert.title}</p>
                  <Badge className={severityClass(alert.severity)}>{alert.severity}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {alert.module} · {alert.attack_type ?? "—"}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <Pagination page={page} pageSize={PAGE_SIZE} total={alerts.length} onPage={setPage} />
          </div>
        </>
      ) : (
        <p className="text-sm text-muted">No hay alertas recientes.</p>
      )}
    </Card>
  );
}
