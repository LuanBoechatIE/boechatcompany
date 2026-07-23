"use client";

import {
  m,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect, useRef } from "react";
import { Reveal } from "./Reveal";

const SIZE = 180;
const STROKE = 12;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

function Score({ label, value, delay }: { label: string; value: number; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 60, damping: 18, mass: 1 });
  const offset = useTransform(spring, (v) => CIRC - (CIRC * v) / 100);
  const display = useTransform(spring, (v) => Math.round(v).toString());

  useEffect(() => {
    if (!inView) return;
    const t = setTimeout(() => mv.set(value), delay * 1000);
    return () => clearTimeout(t);
  }, [inView, mv, value, delay]);

  return (
    <div ref={ref} className="flex flex-col items-center">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke="rgba(16,185,129,0.18)"
            strokeWidth={STROKE}
            fill="none"
          />
          <m.circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke="#10B981"
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={CIRC}
            style={{ strokeDashoffset: offset }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <m.span className="font-display text-5xl text-[#10B981]">
            {display}
          </m.span>
        </div>
      </div>
      <span className="mt-5 text-center text-sm font-medium uppercase tracking-widest text-gelo-dim">
        {label}
      </span>
    </div>
  );
}

const scores = [
  { label: "Performance", value: 100 },
  { label: "Acessibilidade", value: 100 },
  { label: "Boas práticas", value: 100 },
  { label: "SEO", value: 100 },
];

export function Performance() {
  return (
    <section className="border-t border-ink-line/60 py-28 sm:py-40">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-end gap-10 sm:grid-cols-[1.4fr_1fr]">
          <Reveal>
            <span className="text-sm font-medium uppercase tracking-[0.2em] text-roxo-light">
              Performance como diferencial
            </span>
            <h2 className="mt-4 font-display text-[clamp(2rem,5vw,4.2rem)] uppercase leading-[0.98] text-balance">
              Site lento perde venda.
              <br />
              O meu, <span className="text-roxo-light">não</span>
              <span className="text-roxo">.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-lg leading-relaxed text-gelo-dim">
              Cada décimo de segundo a mais custa cliente. Por isso meus sites
              entram com Lighthouse no teto, do mobile ao desktop.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.15}>
          <div className="mt-16 grid gap-12 rounded-3xl border border-ink-line bg-ink-soft/40 p-10 sm:p-14 md:grid-cols-4">
            {scores.map((s, i) => (
              <Score key={s.label} {...s} delay={i * 0.15} />
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.3}>
          <p className="mt-8 text-center text-sm text-gelo-dim">
            Métrica oficial Google Lighthouse, em ambiente mobile simulado.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
