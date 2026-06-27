"use client";

import { Reveal } from "./Reveal";

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
    body: "Posicionamento, presença e um caminho que converte. Aí cada real rende — com ou sem aumentar a verba.",
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
          <h2 className="mt-6 max-w-4xl font-display text-[clamp(2rem,5vw,4.2rem)] uppercase leading-[0.98] text-balance">
            Você não tem um problema de tráfego.
            <br />
            Tem um de conversão
            <span className="text-roxo">.</span>
          </h2>
        </Reveal>

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
      </div>
    </section>
  );
}
