"use client";

import { motion } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import type { ReactNode } from "react";
import { CARD_TIER, type CardTier } from "../ui/cardTiers";

export function KpiCard({
  label,
  value,
  sub,
  icon,
  sparkline,
  accent = "#a78bfa",
  delay = 0,
  tier = "standard",
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: ReactNode;
  sparkline?: number[];
  accent?: string;
  delay?: number;
  tier?: CardTier;
}) {
  const data = sparkline?.map((v, i) => ({ i, v }));
  const flat = sparkline && sparkline.every((v) => v === sparkline[0]);
  const t = CARD_TIER[tier];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative flex flex-col justify-between overflow-hidden ${t.container}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-gelo-dim">
          {label}
        </span>
        {icon && (
          <span className="h-3.5 w-3.5 shrink-0 text-gelo-dim/70 transition-colors group-hover:text-roxo-light [&_svg]:h-3.5 [&_svg]:w-3.5">
            {icon}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <div className={`font-display truncate leading-none text-gelo ${t.value}`}>
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
