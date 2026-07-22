"use client";

import { motion } from "framer-motion";
import { Reveal } from "./Reveal";
import { SectionCTA } from "./SectionCTA";
import { SpotlightGlow } from "./SpotlightGlow";

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

        <div className="mt-20 flex flex-col">
          {fases.map((f, i) => (
            <Reveal key={f.n} delay={i * 0.08}>
              <div
                className={`relative flex gap-6 sm:gap-8 ${
                  i === fases.length - 1 ? "pb-0" : "pb-10 sm:pb-14"
                }`}
              >
                {i < fases.length - 1 && (
                  <motion.span
                    aria-hidden
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute bottom-0 left-5 top-10 w-px origin-top bg-gradient-to-b from-roxo to-roxo-light/20 sm:left-6 sm:top-12"
                  />
                )}

                <div className="relative z-10 flex w-10 shrink-0 justify-center sm:w-12">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-roxo bg-ink font-display text-sm text-roxo-light sm:h-12 sm:w-12">
                    {i + 1}
                  </span>
                </div>

                <SpotlightGlow className="flex-1 overflow-hidden rounded-3xl">
                  <motion.div
                    whileHover={{ x: 6 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col gap-3 rounded-3xl border border-ink-line bg-ink-soft/40 p-7 transition-colors duration-300 hover:border-roxo-light/50 sm:flex-row sm:items-start sm:gap-10 sm:p-9"
                  >
                    <h3 className="text-2xl font-medium tracking-tight sm:w-56 sm:shrink-0">
                      {f.title}
                    </h3>
                    <p className="text-base leading-relaxed text-gelo-dim">
                      {f.body}
                    </p>
                  </motion.div>
                </SpotlightGlow>
              </div>
            </Reveal>
          ))}
        </div>

        <SectionCTA
          className="mt-4"
          label="Quero esse processo no meu negócio"
          message="Vi seu site. Quero esse processo de estrutura rodando no meu negócio. Por onde começa?"
        />
      </div>
    </section>
  );
}
