"use client";

import { FadeIn } from "@/components/animations/fade-in";
import { Card } from "@/components/ui/card";

export function KpiCards({
  alerts,
  devicesOnline,
  modelsDeployed,
  critical,
}: {
  alerts: number;
  devicesOnline: number;
  modelsDeployed: number;
  critical: number;
}) {
  const items = [
    { label: "Alertas activas", value: alerts, accent: "border-l-primary" },
    { label: "Nodos online", value: devicesOnline, accent: "border-l-secondary" },
    { label: "Modelos desplegados", value: modelsDeployed, accent: "border-l-muted" },
    { label: "Severidad crítica", value: critical, accent: "border-l-accent" },
  ];

  return (
    <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item, i) => (
        <FadeIn key={item.label} delay={i * 0.06}>
          <Card className={`border-l-[3px] ${item.accent}`}>
            <dt className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
              {item.label}
            </dt>
            <dd className="mt-3 font-display text-3xl tabular-nums text-foreground">
              {item.value}
            </dd>
          </Card>
        </FadeIn>
      ))}
    </dl>
  );
}
