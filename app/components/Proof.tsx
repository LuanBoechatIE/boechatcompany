"use client";

import { Reveal } from "./Reveal";

const stats = [
  { k: "Dias", v: "Entrega em dias, não meses" },
  { k: "1:1", v: "Identidade própria por projeto" },
  { k: "100%", v: "Pensado pra conversão" },
];

export function Proof() {
  return (
    <section className="border-t border-ink-line/60 py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          {stats.map((s, i) => (
            <Reveal key={s.k} delay={i * 0.1}>
              <div className="rounded-2xl border border-ink-line bg-ink-soft/40 p-8">
                <div className="font-display text-5xl text-roxo-light">
                  {s.k}
                </div>
                <div className="mt-4 text-lg text-gelo-dim">{s.v}</div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.15}>
          <figure className="mt-12 rounded-3xl border border-ink-line bg-gradient-to-br from-roxo-deep/40 to-ink-soft p-8 sm:p-14">
            <blockquote className="max-w-4xl text-balance text-[clamp(1.4rem,3vw,2.4rem)] font-medium leading-[1.25] tracking-tight">
              &ldquo;Em poucos dias minha presença mudou de patamar — e a
              diferença apareceu na agenda.&rdquo;
            </blockquote>
            <figcaption className="mt-8 flex items-center gap-4 text-gelo-dim">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-roxo font-display text-white">
                ?
              </span>
              <span>
                <span className="block text-gelo">Seu primeiro depoimento</span>
                <span className="text-sm">
                  espaço reservado — entra o real assim que fechar
                </span>
              </span>
            </figcaption>
          </figure>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="mt-10 text-center">
            <a
              href="/trabalhos"
              className="inline-flex items-center gap-2 text-gelo-dim transition-colors hover:text-gelo"
            >
              Ver trabalhos
              <span aria-hidden>→</span>
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
