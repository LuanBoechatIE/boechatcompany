"use client";

import { Reveal } from "./Reveal";
import { SectionCTA } from "./SectionCTA";

// Absorveu o antigo Method, que contava o mesmo processo em três passos e
// repetia frases inteiras daqui. Herda o id="metodo" porque a navegação
// aponta pra ele.
//
// É a única seção clara da página, por dois motivos: dá o respiro que faltava
// num site que eram oito seções escuras seguidas, e combina com o que ela
// promete. "Sem mistério" pede luz.
//
// `loop` marca a fase que não termina: 01 a 03 entregam e fecham, a 04 roda
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
  return (
    <li className="group/fase relative border-t border-ink/12 last:border-b">
      {/* Acento que cresce no hover. Listrado na fase que se repete, sólido nas
          que fecham: o estado da fase se lê sem precisar de legenda. */}
      <span
        aria-hidden
        className={`absolute left-0 top-0 h-full w-[2px] origin-top scale-y-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/fase:scale-y-100 ${
          f.loop
            ? "bg-[repeating-linear-gradient(to_bottom,var(--color-roxo)_0_6px,transparent_6px_12px)]"
            : "bg-roxo"
        }`}
      />

      <Reveal
        delay={delay}
        className="grid gap-x-8 gap-y-3 py-8 transition-colors duration-500 group-hover/fase:bg-ink/[0.04] sm:py-10 lg:grid-cols-[5rem_minmax(0,0.9fr)_minmax(0,1.5fr)] lg:px-6"
      >
        <div className="lg:pt-1">
          <span className="font-display text-[2.6rem] leading-none text-ink/20 transition-colors duration-500 group-hover/fase:text-roxo sm:text-[3rem]">
            {f.n}
          </span>
          <span className="mt-2 block text-[11px] uppercase tracking-[0.18em] text-ink/45">
            {f.loop ? "ciclo contínuo" : "fase"}
          </span>
        </div>

        <h3 className="self-start text-2xl font-medium leading-tight tracking-tight sm:text-[1.75rem]">
          {f.title}
        </h3>

        <p className="self-start text-base leading-relaxed text-ink/70">
          {f.body}
        </p>
      </Reveal>
    </li>
  );
}

export function Entrega() {
  return (
    <section id="metodo" className="bg-gelo py-28 text-ink sm:py-40">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-end gap-10 sm:grid-cols-[1.4fr_1fr]">
          <Reveal>
            <span className="text-sm font-medium uppercase tracking-[0.2em] text-roxo">
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
            <p className="text-lg leading-relaxed text-ink/70">
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
          onLight
          label="Quero esse processo no meu negócio"
          message="Vi seu site. Quero esse processo de estrutura rodando no meu negócio. Por onde começa?"
        />
      </div>
    </section>
  );
}
