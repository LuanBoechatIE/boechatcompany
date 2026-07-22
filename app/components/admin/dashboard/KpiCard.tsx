"use client";

import { motion } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import type { ComponentType } from "react";

export function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  sparkline,
  accent = "#a78bfa",
  delay = 0,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: ComponentType<{ className?: string }>;
  sparkline?: number[];
  accent?: string;
  delay?: number;
}) {
  const data = sparkline?.map((v, i) => ({ i, v }));
  const flat = sparkline && sparkline.every((v) => v === sparkline[0]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-ink-line bg-ink-soft/40 p-4 transition-colors hover:border-roxo-light/30"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-gelo-dim">
          {label}
        </span>
        {Icon && (
          <Icon className="h-3.5 w-3.5 shrink-0 text-gelo-dim/70 transition-colors group-hover:text-roxo-light" />
        )}
      </div>

      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <div className="font-display truncate text-2xl leading-none text-gelo">
            {value}
          </div>
          {sub && <div className="mt-1.5 text-[11px] text-gelo-dim">{sub}</div>}
        </div>

        {data && data.length > 1 && !flat && (
          <div className="h-8 w-16 shrink-0 opacity-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id={`spark-${label}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accent} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={accent}
                  strokeWidth={1.5}
                  fill={`url(#spark-${label})`}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </motion.div>
  );
}
