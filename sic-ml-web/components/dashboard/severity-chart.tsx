"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";

export type SeverityPoint = { name: string; value: number; fill: string };

/** Barras por severidad de las alertas activas (con picos donde hay más). */
export function SeverityChart({ data }: { data: SeverityPoint[] }) {
  return (
    <Card className="h-[340px]">
      <p className="mb-1 font-display text-lg">Alertas por severidad</p>
      <p className="mb-4 text-xs text-muted">Distribución de alertas activas</p>
      {!data.length || data.every((d) => d.value === 0) ? (
        <p className="flex h-[260px] items-center justify-center text-sm text-muted">Sin alertas activas.</p>
      ) : (
        <div className="h-[260px] w-full" role="img" aria-label="Gráfico de barras de alertas por severidad">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: -18 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke="var(--muted)" fontSize={12} />
              <YAxis stroke="var(--muted)" fontSize={12} allowDecimals={false} width={28} />
              <Tooltip
                formatter={(value) => [String(value), "alertas"]}
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  color: "var(--foreground)",
                }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="var(--primary)">
                {data.map((d) => (
                  <Cell key={d.name} fill={d.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
