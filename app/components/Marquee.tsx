"use client";

import { ScrollVelocityMarquee } from "./ScrollVelocityMarquee";

const items = [
  "Posicionamento",
  "Presença afiada",
  "Estrutura comercial",
  "Conversão",
  "Pipeline",
  "Atendimento 24h",
  "Aquisição",
  "Crescimento",
];

export function Marquee() {
  return (
    <div className="relative overflow-hidden border-y border-ink-line/60 bg-ink-soft/30 py-6 backdrop-blur-sm [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-roxo-light/40 to-transparent"
      />
      <ScrollVelocityMarquee baseVelocity={2.4}>
        {items.map((m, i) => (
          <span key={m} className="inline-flex items-center gap-5 px-6">
            <span
              className={`font-display whitespace-nowrap text-lg uppercase tracking-wide sm:text-xl ${
                i % 2 === 0 ? "text-gelo" : "text-gelo-dim/60"
              }`}
            >
              {m}
            </span>
            <span
              aria-hidden
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-roxo-light shadow-[0_0_10px_2px_rgba(167,139,250,0.55)]"
            />
          </span>
        ))}
      </ScrollVelocityMarquee>
    </div>
  );
}
