"use client";

import { Reveal } from "./Reveal";
import { SectionCTA } from "./SectionCTA";

const steps = [
  {
    n: "01",
    title: "Entendo seu jogo",
    body: "Antes de qualquer pixel: o que você vende, pra quem, e onde o dinheiro está vazando. Diagnóstico comercial, não questionário de cor preferida.",
  },
  {
    n: "02",
    title: "Construo a estrutura",
    body: "Posicionamento, presença afiada e um caminho desenhado pra converter. Identidade própria, feita pra impor autoridade e fazer o cliente agir.",
  },
  {
    n: "03",
    title: "Você vende mais",
    body: "O que te descobre vira quem te paga. Cada peça refinada com você até estar à altura do que você entrega.",
  },
];

export function Method() {
  return (
    <section id="metodo" className="bg-gelo py-28 text-ink sm:py-40">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <span className="text-sm font-medium uppercase tracking-[0.2em] text-roxo">
            Como eu trabalho
          </span>
          <h2 className="mt-4 max-w-3xl font-display text-[clamp(2.2rem,6vw,5rem)] uppercase leading-[0.95] text-balance">
            Simples. Direto.
            <br />
            Feito pra vender
            <span className="text-roxo">.</span>
          </h2>
        </Reveal>

        <div className="mt-20 grid gap-12 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.1}>
              <div className="flex flex-col border-t-2 border-ink/10 pt-6">
                <span className="font-display text-5xl text-roxo">{s.n}</span>
                <h3 className="mt-6 text-2xl font-medium tracking-tight">
                  {s.title}
                </h3>
                <p className="mt-3 text-lg leading-relaxed text-ink/70">
                  {s.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <SectionCTA
          className="mt-16"
          onLight
          label="Quero entender meu jogo"
          message="Vi seu site. Quero entender meu jogo e onde meu dinheiro tá vazando."
        />
      </div>
    </section>
  );
}
