"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatBRL } from "@/app/lib/crm/format";

const COLORS = ["#a78bfa", "#6d28d9", "#4c1d95", "#c4b5fd", "#2e1065"];

export function ServiceDonutChart({
  data,
}: {
  data: { servico: string; valor: number }[]
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <span className="text-xs text-gelo-dim/70">Sem contratos ativos ainda</span>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center gap-4">
      <div className="h-full min-w-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="valor"
              nameKey="servico"
              innerRadius="62%"
              outerRadius="88%"
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((d, i) => (
                <Cell key={d.servico} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#211a31",
                border: "1px solid #2c2340",
                borderRadius: 12,
                fontSize: 12,
              }}
              labelStyle={{ color: "#c9c4d6" }}
              formatter={(v) => formatBRL(Number(v))}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex shrink-0 flex-col gap-2">
        {data.map((d, i) => (
          <li key={d.servico} className="flex items-center gap-2 text-xs">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: COLORS[i % COLORS.length] }}
            />
            <span className="max-w-[110px] truncate text-gelo-dim">{d.servico}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
