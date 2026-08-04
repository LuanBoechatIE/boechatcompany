"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import { Reveal } from "./Reveal";
import { SectionCTA } from "./SectionCTA";

// A seção promete "você sabe em qual fase está". O formato segue a promessa:
// uma folha de operação, com fio separando cada fase, e não cartão empilhado.
// `loop` marca a fase que não termina — 01 a 03 entregam e fecham, a 04 roda
// enquanto durar o contrato.
const fases = [
  {
    n: "01",
    title: "Diagnóstico comercial",
    body: "Mapeio onde o dinheiro está vazando: oferta, gargalo, conversão, ticket, recorrência. Você sai dessa conversa entendendo o que trava, mesmo que não feche.",
  },
  {
    n: "02",
    title: "Construção da estrutura",
    body: "Posicionamento, presença afiada, processo de conversão. Cada peça desenhada pra UM trabalho: transformar visita em cliente, e cliente em recorrência.",
  },
  {
    n: "03",
    title: "Implementação",
    body: "Site, materiais, scripts, follow-up. Tudo no ar e nas mãos do seu comercial. Refino com você até estar afiado. Você não precisa virar especialista pra rodar.",
  },
  {
    n: "04",
    title: "Operação & ajuste",
    body: "Acompanho o que o número mostra. Onde tá convertendo, onde tá vazando. Ajusto o que precisar pra manter o motor rodando.",
    loop: true,
  },
];

function Fase({ f, delay }: { f: (typeof fases)[number]; delay: number }) {
  const ref = useRef<HTMLLIElement>(null);
  // Hover não existe em toque, então no celular o acento nunca acendia.
  // Faixa fina no centro da tela (10% de altura) em vez de faixa larga: só a
  // fase que está passando pelo centro acende, como um holofote que se move
  // com a rolagem. Sem `once`, ela apaga de novo ao sair da faixa — cada fase
  // acende sozinha na sua vez, não fica tudo aceso pra sempre.
  const emFoco = useInView(ref, { margin: "-45% 0px -45% 0px" });

  return (
    <li ref={ref} className="group/fase relative border-t border-ink-line/70 last:border-b">
      {/* Sólido nas fases que fecham, listrado na que se repete: o estado da
          fase se lê sem precisar de legenda. */}
      <span
        aria-hidden
        className={`absolute left-0 top-0 h-full w-[2px] origin-top transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          emFoco ? "scale-y-100" : "scale-y-0 group-hover/fase:scale-y-100"
        } ${
          f.loop
            ? "bg-[repeating-linear-gradient(to_bottom,var(--color-roxo-light)_0_6px,transparent_6px_12px)]"
            : "bg-roxo"
        }`}
      />

      <Reveal
        delay={delay}
        // Padding horizontal em toda largura, não só a partir do `lg`: a barra
        // de acento é `absolute left-0`, e sem respiro o texto colava nela no
        // celular. `gap-y-4` maior no empilhado (antes do grid de 3 colunas
        // do `lg`) porque numeral, título e corpo ficam na mesma coluna.
        className={`grid gap-x-8 gap-y-4 px-5 py-8 transition-colors duration-500 sm:px-6 sm:py-10 lg:grid-cols-[5rem_minmax(0,0.9fr)_minmax(0,1.5fr)] lg:gap-y-3 ${
          emFoco ? "bg-ink-soft/40" : "group-hover/fase:bg-ink-soft/40"
        }`}
      >
        <div className="lg:pt-1">
          <span
            className={`font-display text-[2.6rem] leading-none transition-colors duration-500 sm:text-[3rem] ${
              emFoco ? "text-roxo-light" : "text-gelo/25 group-hover/fase:text-roxo-light"
            }`}
          >
            {f.n}
          </span>
          <span className="mt-2 block text-[11px] uppercase tracking-[0.18em] text-gelo-dim/60">
            {f.loop ? "ciclo contínuo" : "fase"}
          </span>
        </div>

        <h3 className="self-start text-2xl font-medium leading-tight tracking-tight sm:text-[1.75rem]">
          {f.title}
        </h3>

        <p className="self-start text-base leading-relaxed text-gelo-dim">
          {f.body}
        </p>
      </Reveal>
    </li>
  );
}

export function Entrega() {
  return (
    <section className="border-t border-ink-line/60 py-28 sm:py-40">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-end gap-10 sm:grid-cols-[1.4fr_1fr]">
          <Reveal>
            <span className="text-sm font-medium uppercase tracking-[0.2em] text-roxo-light">
              Como eu entrego
            </span>
            <h2 className="mt-4 font-display text-[clamp(2rem,5vw,4.2rem)] uppercase leading-[0.98] text-balance">
              Processo claro.
              <br />
              Sem mistério
              <span className="text-roxo">.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-lg leading-relaxed text-gelo-dim">
              Sem &ldquo;método secreto&rdquo;. Você sabe o que estou fazendo,
              em qual fase, e o que vem depois. Quem entrega de verdade não
              precisa esconder.
            </p>
          </Reveal>
        </div>

        {/* Lista ordenada de propósito: a ordem é informação, não estilo. */}
        <ol className="mt-16">
          {fases.map((f, i) => (
            <Fase key={f.n} f={f} delay={i * 0.06} />
          ))}
        </ol>

        <SectionCTA
          className="mt-12"
          label="Quero esse processo no meu negócio"
          message="Vi seu site. Quero esse processo de estrutura rodando no meu negócio. Por onde começa?"
        />
      </div>
    </section>
  );
}
