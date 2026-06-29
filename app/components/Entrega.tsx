"use client";

import { motion } from "framer-motion";
import { Reveal } from "./Reveal";
import { SectionCTA } from "./SectionCTA";

const fases = [
  {
    n: "fase 01",
    title: "Diagnóstico comercial",
    body: "Mapeio onde o dinheiro está vazando: oferta, gargalo, conversão, ticket, recorrência. Você sai dessa conversa entendendo o que trava, mesmo que não feche.",
  },
  {
    n: "fase 02",
    title: "Construção da estrutura",
    body: "Posicionamento, presença afiada, processo de conversão. Cada peça desenhada pra UM trabalho: transformar visita em cliente, e cliente em recorrência.",
  },
  {
    n: "fase 03",
    title: "Implementação",
    body: "Site, materiais, scripts, follow-up. Tudo no ar e nas mãos do seu comercial. Refino com você até estar afiado. Você não precisa virar especialista pra rodar.",
  },
  {
    n: "fase 04",
    title: "Operação & ajuste",
    body: "Acompanho o que o número mostra. Onde tá convertendo, onde tá vazando. Ajusto o que precisar pra manter o motor rodando.",
  },
];

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

        <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-ink-line bg-ink-line md:grid-cols-2 xl:grid-cols-4">
          {fases.map((f, i) => (
            <Reveal key={f.n} delay={i * 0.08}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
                className="flex h-full flex-col bg-ink p-8 sm:p-10"
              >
                <span className="text-xs font-medium uppercase tracking-widest text-roxo-light">
                  {f.n}
                </span>
                <h3 className="mt-4 text-2xl font-medium tracking-tight">
                  {f.title}
                </h3>
                <p
                  className="mt-3 text-base leading-relaxed text-gelo-dim"
                  dangerouslySetInnerHTML={{ __html: f.body }}
                />
              </motion.div>
            </Reveal>
          ))}
        </div>

        <SectionCTA
          className="mt-14"
          label="Quero esse processo no meu negócio"
          message="Vi seu site. Quero esse processo de estrutura rodando no meu negócio. Por onde começa?"
        />
      </div>
    </section>
  );
}
