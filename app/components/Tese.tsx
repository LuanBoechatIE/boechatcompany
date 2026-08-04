"use client";

import { Reveal } from "./Reveal";
import { WordReveal } from "./WordReveal";
import { SectionCTA } from "./SectionCTA";
import { SpotlightGlow } from "./SpotlightGlow";

// Esta seção absorveu o antigo Manifesto. As duas defendiam a mesma tese com
// as mesmas palavras ("não traz venda", "posicionamento, presença e um
// caminho que converte"), uma logo depois da outra, e o leitor pagava duas
// seções de rolagem pela mesma ideia.
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
    <section id="manifesto" className="border-t border-ink-line/60 py-28 sm:py-40">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <span className="text-sm font-medium uppercase tracking-[0.2em] text-roxo-light">
            O jogo virou
          </span>
        </Reveal>

        <WordReveal
          className="mt-6 block max-w-4xl font-display text-[clamp(2.2rem,5.6vw,4.8rem)] uppercase leading-[0.98] text-balance"
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

        <Reveal delay={0.1}>
          <p className="mt-8 max-w-3xl text-xl leading-relaxed text-gelo-dim sm:text-2xl">
            Há uns anos, jogar dinheiro num anúncio era suficiente pra vender:
            um gestor de tráfego apertava &ldquo;impulsionar&rdquo; e o cliente
            caía. Hoje, todo mundo faz isso. O cliente é mais esperto, o feed é
            saturado, e{" "}
            <span className="text-gelo">aparecer parou de significar vender</span>
            .
          </p>
        </Reveal>

        {/* Colunas separadas por fio, sem caixa. A grade de células com fundo
            aparecia em quatro seções diferentes e era o que dava à página a
            sensação de planilha. */}
        <div className="mt-20 grid gap-10 md:grid-cols-3 md:gap-0">
          {points.map((p, i) => (
            <Reveal
              key={p.n}
              delay={i * 0.1}
              className={i > 0 ? "md:border-l md:border-ink-line md:pl-10" : "md:pr-10"}
            >
              <SpotlightGlow className="h-full rounded-2xl">
                <span className="font-display text-5xl text-gelo/20">{p.n}</span>
                <h3 className="mt-6 text-2xl font-medium tracking-tight">
                  {p.title}
                </h3>
                <p className="mt-3 text-lg leading-relaxed text-gelo-dim">
                  {p.body}
                </p>
              </SpotlightGlow>
            </Reveal>
          ))}
        </div>

        <SectionCTA
          className="mt-16"
          label="Quero resolver minha conversão"
          message="Vi seu site. Acho que meu problema é conversão, não tráfego. Como você resolve isso?"
        />
      </div>
    </section>
  );
}
