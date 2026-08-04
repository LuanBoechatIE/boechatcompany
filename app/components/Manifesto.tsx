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
            Hoje, <span className="text-gelo-dim">todo mundo faz isso</span>. E{" "}
            <span className="text-roxo-light">aparecer parou de significar vender</span>
            .
          </p>
        </Reveal>

        {/* A virada é tempo, não comparação. Por isso desce em vez de abrir em
            duas colunas: o passado fica acima e apagado, o presente embaixo e
            aceso. O trilho vai de cinza morto a roxo, fazendo a passagem. */}
        <div className="relative mt-20 max-w-4xl pl-9 sm:pl-14">
          <span
            aria-hidden
            className="absolute bottom-1 left-0 top-1 w-px bg-gradient-to-b from-ink-line via-roxo/50 to-roxo-light"
          />

          <Reveal>
            <div className="relative">
              <span
                aria-hidden
                className="absolute -left-9 top-[0.55rem] h-2 w-2 -translate-x-1/2 rounded-full border border-gelo-dim/40 bg-ink sm:-left-14"
              />
              <span className="text-sm font-medium uppercase tracking-widest text-gelo-dim/50">
                Antes
              </span>
              <p className="mt-4 text-lg leading-relaxed text-gelo-dim/55">
                Pouca concorrência. Um gestor de tráfego apertava
                &ldquo;impulsionar&rdquo; e o cliente caía. Amadorismo era luxo
                que dava pra pagar.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="relative mt-14">
              <span
                aria-hidden
                className="absolute -left-9 top-[0.55rem] h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-roxo-light shadow-[0_0_16px_-2px_var(--color-roxo-light)] sm:-left-14"
              />
              <span className="text-sm font-medium uppercase tracking-widest text-roxo-light">
                Agora
              </span>
              <p className="mt-4 text-[1.4rem] leading-relaxed text-gelo sm:text-[1.6rem]">
                O cliente é mais esperto, o feed é saturado. Vende quem tem{" "}
                <span className="text-roxo-light">estrutura</span>:
                posicionamento, presença e um processo que converte. O resto
                vira história.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
