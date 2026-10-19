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

export function EventsChart() {
  return (
    <Card className="h-[340px]">
      <p className="mb-4 font-display text-lg">Eventos por módulo</p>
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartSeries}>
            <defs>
              <linearGradient id="ids" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="iot" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(68,64,60,0.45)" strokeDasharray="3 3" />
            <XAxis dataKey="name" stroke="#78716c" fontSize={12} />
            <YAxis stroke="#78716c" fontSize={12} />
            <Tooltip
              contentStyle={{
                background: "#211f1c",
                border: "1px solid #44403c",
                borderRadius: 12,
                color: "#FEF3C7",
              }}
            />
            <Area
              type="monotone"
              dataKey="ids"
              stroke="#F59E0B"
              fill="url(#ids)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="iot"
              stroke="#10B981"
              fill="url(#iot)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="phishing"
              stroke="#F43F5E"
              fill="transparent"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
