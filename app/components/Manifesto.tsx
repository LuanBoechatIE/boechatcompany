"use client";

import { Reveal } from "./Reveal";

export function Manifesto() {
  return (
    <section
      id="manifesto"
      className="relative border-t border-ink-line/60 py-28 sm:py-40"
    >
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <span className="text-sm font-medium uppercase tracking-[0.2em] text-roxo-light">
            O jogo virou
          </span>
        </Reveal>

        <Reveal delay={0.05}>
          <p className="mt-8 max-w-5xl text-[clamp(1.7rem,4vw,3.4rem)] font-medium leading-[1.1] tracking-tight text-balance">
            Há uns anos, jogar dinheiro num anúncio era suficiente pra vender.
            Hoje, <span className="text-gelo-dim">todo mundo faz isso</span> — e{" "}
            <span className="text-roxo-light">aparecer parou de significar vender</span>
            .
          </p>
        </Reveal>

        <div className="mt-20 grid gap-px overflow-hidden rounded-3xl border border-ink-line bg-ink-line md:grid-cols-2">
          <Reveal className="bg-ink p-8 sm:p-12">
            <div className="text-sm font-medium uppercase tracking-widest text-gelo-dim">
              Antes
            </div>
            <p className="mt-5 text-xl leading-relaxed text-gelo-dim">
              Pouca concorrência. Um gestor de tráfego apertava
              &ldquo;impulsionar&rdquo; e o cliente caía. Amadorismo era luxo
              que dava pra pagar.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="bg-ink-soft p-8 sm:p-12">
            <div className="text-sm font-medium uppercase tracking-widest text-roxo-light">
              Agora
            </div>
            <p className="mt-5 text-xl leading-relaxed text-gelo">
              O cliente é mais esperto, o feed é saturado. Vende quem tem{" "}
              <span className="text-roxo-light">estrutura</span> — posicionamento,
              presença e um processo que converte. O resto vira história.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
