"use client";

import { Badge } from "@/components/ui/badge";
import { severityClass } from "@/lib/utils";

export type TickerAlert = {
  id: string;
  title: string;
  severity: string;
  module: string;
};

/** Ticker horizontal (marquee) con las últimas alertas activas. */
export function AlertsTicker({ alerts }: { alerts: TickerAlert[] }) {
  if (!alerts.length) return null;
  const doubled = [...alerts, ...alerts];

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card" aria-label="Últimas alertas activas">
      <div className="animate-marquee flex w-max items-center gap-3 px-4 py-3">
        {doubled.map((a, i) => (
          <span key={`${a.id}-${i}`} className="flex shrink-0 items-center gap-2 rounded-full border border-border/70 bg-background-elevated/60 px-3 py-1.5 text-xs">
            <Badge className={severityClass(a.severity)}>{a.severity}</Badge>
            <span className="font-medium">{a.title}</span>
            <span className="text-muted">· {a.module}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
