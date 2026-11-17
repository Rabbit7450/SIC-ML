"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { chartSeries } from "@/lib/demo-data";

type EventPoint = { name: string; ids: number; iot: number; phishing: number };

export function EventsChart({ data = chartSeries }: { data?: EventPoint[] }) {
  return (
    <Card className="h-[340px]">
      <p className="mb-1 font-display text-lg">Eventos por módulo</p>
      <p className="mb-4 text-xs text-muted">Últimos 7 días</p>
      {!data.length ? <p className="flex h-[260px] items-center justify-center text-sm text-muted">Sin eventos en el período seleccionado.</p> : (
      <div className="h-[260px] w-full" role="img" aria-label="Gráfico de eventos por módulo (IDS, IoT y phishing) en los últimos 7 días">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="ids" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-ids)" stopOpacity={0.24} />
                <stop offset="95%" stopColor="var(--chart-ids)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="iot" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-iot)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--chart-iot)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="phishing" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-phishing)" stopOpacity={0.16} />
                <stop offset="95%" stopColor="var(--chart-phishing)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis dataKey="name" stroke="var(--muted)" fontSize={12} />
            <YAxis stroke="var(--muted)" fontSize={12} allowDecimals={false} width={28} />
            <Tooltip
              formatter={(value) => [String(value), "eventos"]}
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                color: "var(--foreground)",
                boxShadow: "0 8px 24px rgba(15, 23, 42, 0.12)",
              }}
            />
            <Area
              type="monotone"
              dataKey="ids"
              stroke="var(--chart-ids)"
              fill="url(#ids)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="iot"
              stroke="var(--chart-iot)"
              fill="url(#iot)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="phishing"
              stroke="var(--chart-phishing)"
              fill="url(#phishing)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      )}
    </Card>
  );
}
