"use client";

import { m, useMotionValue, useMotionTemplate } from "framer-motion";
import type { MouseEvent, ReactNode } from "react";

export function SpotlightGlow({
  children,
  className,
  color = "167,139,250",
  size = 380,
}: {
  children: ReactNode;
  className?: string;
  color?: string;
  size?: number;
}) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  function onMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set(e.clientX - rect.left);
    my.set(e.clientY - rect.top);
  }

  const background = useMotionTemplate`radial-gradient(${size}px circle at ${mx}px ${my}px, rgba(${color},0.18), transparent 70%)`;

  return (
    <div
      onMouseMove={onMouseMove}
      className={`group/spot relative ${className ?? ""}`}
    >
      <m.div
        aria-hidden
        style={{ background }}
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-500 group-hover/spot:opacity-100"
      />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
