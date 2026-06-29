"use client";

import { Reveal } from "./Reveal";
import { WordReveal } from "./WordReveal";
import { SectionCTA } from "./SectionCTA";

const points = [
  {
    n: "01",
    title: "Anúncio é torneira de gente",
    body: "Ele traz visita. Não traz venda. Confundir as duas coisas é exatamente onde o seu dinheiro some.",
  },
  {
    n: "02",
    title: "Sem estrutura, escalar é vazar mais rápido",
    body: "Você paga pra trazer quem chega, não se convence e vai embora. Colocar mais verba só acelera o prejuízo.",
  },
  {
    n: "03",
    title: "Estrutura faz o mesmo anúncio vender mais",
    body: "Posicionamento, presença e um caminho que converte. Aí cada real rende, com ou sem aumentar a verba.",
  },
];

export function Tese() {
  return (
    <section className="border-t border-ink-line/60 py-28 sm:py-40">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <span className="text-sm font-medium uppercase tracking-[0.2em] text-roxo-light">
            Por que mais anúncio não resolve
          </span>
        </Reveal>
        <WordReveal
          className="mt-6 block max-w-4xl font-display text-[clamp(2rem,5vw,4.2rem)] uppercase leading-[0.98] text-balance"
          tokens={[
            "Você",
            "não",
            "tem",
            "um",
            "problema",
            "de",
            "tráfego.",
            "Tem",
            "um",
            "de",
            { w: "conversão.", className: "text-roxo-light" },
          ]}
        />

        <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-ink-line bg-ink-line md:grid-cols-3">
          {points.map((p, i) => (
            <Reveal key={p.n} delay={i * 0.1} className="bg-ink p-8 sm:p-10">
              <span className="font-display text-5xl text-roxo-light">
                {p.n}
              </span>
              <h3 className="mt-6 text-2xl font-medium tracking-tight">
                {p.title}
              </h3>
              <p className="mt-3 text-lg leading-relaxed text-gelo-dim">
                {p.body}
              </p>
            </Reveal>
          ))}
        </div>

        <SectionCTA
          className="mt-14"
          label="Quero resolver minha conversão"
          message="Vi seu site. Acho que meu problema é conversão, não tráfego. Como você resolve isso?"
        />
      </div>
    </section>
  );
}
