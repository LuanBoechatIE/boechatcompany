"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { formatBRL } from "@/app/lib/crm/format";

export function RecurringVsSetupChart({
  data,
}: {
  data: { mes: string; recorrente: number; implementacao: number }[]
}) {
  const hasData = data.some((d) => d.recorrente > 0 || d.implementacao > 0);

  return (
    <div className="relative h-full w-full">
      {!hasData && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <span className="text-xs text-gelo-dim/70">Sem pagamentos registrados ainda</span>
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#2c2340" vertical={false} />
          <XAxis
            dataKey="mes"
            tick={{ fill: "#c9c4d6", fontSize: 11 }}
            axisLine={{ stroke: "#2c2340" }}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: "rgba(167,139,250,0.08)" }}
            contentStyle={{
              background: "#211a31",
              border: "1px solid #2c2340",
              borderRadius: 12,
              fontSize: 12,
            }}
            labelStyle={{ color: "#c9c4d6" }}
            formatter={(v, name) => [formatBRL(Number(v)), String(name)]}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, color: "#c9c4d6" }}
            iconType="circle"
            iconSize={6}
          />
          <Bar dataKey="implementacao" name="Implementação" fill="#6d28d9" radius={[4, 4, 0, 0]} stackId="a" />
          <Bar dataKey="recorrente" name="Recorrente" fill="#a78bfa" radius={[4, 4, 0, 0]} stackId="a" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
