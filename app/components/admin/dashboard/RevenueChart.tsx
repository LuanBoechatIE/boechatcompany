"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatBRL } from "@/app/lib/crm/format";

export function RevenueChart({ data }: { data: { mes: string; total: number }[] }) {
  const hasData = data.some((d) => d.total > 0);

  return (
    <div className="h-full w-full">
      {!hasData && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <span className="text-xs text-gelo-dim/70">Sem receita registrada ainda</span>
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#2c2340" vertical={false} />
          <XAxis
            dataKey="mes"
            tick={{ fill: "#c9c4d6", fontSize: 11 }}
            axisLine={{ stroke: "#2c2340" }}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            cursor={{ stroke: "#6d28d9", strokeWidth: 1 }}
            contentStyle={{
              background: "#211a31",
              border: "1px solid #2c2340",
              borderRadius: 12,
              fontSize: 12,
            }}
            labelStyle={{ color: "#c9c4d6" }}
            formatter={(v) => [formatBRL(Number(v)), "Receita"]}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#a78bfa"
            strokeWidth={2}
            fill="url(#revenue-fill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
