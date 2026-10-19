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
    { label: "Alertas activas", value: alerts, glow: true },
    { label: "Nodos online", value: devicesOnline, glow: false },
    { label: "Modelos desplegados", value: modelsDeployed, glow: false },
    { label: "Severidad crítica", value: critical, glow: true },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item, i) => (
        <FadeIn key={item.label} delay={i * 0.06}>
          <Card glow={item.glow}>
            <p className="text-xs uppercase tracking-[0.16em] text-muted">
              {item.label}
            </p>
            <p className="mt-3 font-display text-3xl text-primary">
              {item.value}
            </p>
          </Card>
        </FadeIn>
      ))}
    </div>
  );
}
