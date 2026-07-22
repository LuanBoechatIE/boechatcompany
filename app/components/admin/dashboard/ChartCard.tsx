"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function ChartCard({
  title,
  sub,
  children,
  delay = 0,
  className = "",
}: {
  title: string;
  sub?: string;
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`relative flex flex-col overflow-hidden rounded-2xl border border-ink-line bg-ink-soft/40 p-4 ${className}`}
    >
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h3 className="text-xs font-medium uppercase tracking-wide text-gelo">{title}</h3>
        {sub && <span className="text-[11px] text-gelo-dim">{sub}</span>}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </motion.div>
  );
}
