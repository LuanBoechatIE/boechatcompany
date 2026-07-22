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
    <div className="overflow-hidden border-t border-ink-line/60 bg-ink/40 py-4 backdrop-blur-sm [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <ScrollVelocityMarquee baseVelocity={2.4}>
        {items.map((m) => (
          <span
            key={m}
            className="inline-flex items-center gap-3 whitespace-nowrap px-5 text-sm text-gelo-dim"
          >
            <span className="text-roxo-light">/</span>
            {m}
          </span>
        ))}
      </ScrollVelocityMarquee>
    </div>
  );
}
