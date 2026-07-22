"use client";

import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import type { MouseEvent } from "react";
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

function Stop({
  f,
  i,
  isLast,
}: {
  f: (typeof fases)[number];
  i: number;
  isLast: boolean;
}) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  function onMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set(e.clientX - rect.left);
    my.set(e.clientY - rect.top);
  }

  const glow = useMotionTemplate`radial-gradient(380px circle at ${mx}px ${my}px, rgba(167,139,250,0.16), transparent 70%)`;

  return (
    <div className={`relative flex gap-4 sm:gap-6 ${isLast ? "" : "pb-10 sm:pb-14"}`}>
      {!isLast && (
        <motion.span
          aria-hidden
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="absolute bottom-0 left-5 top-10 w-[3px] origin-top rounded-full bg-gradient-to-b from-roxo via-roxo-light/60 to-roxo-light/10 shadow-[0_0_14px_rgba(167,139,250,0.45)] sm:left-6 sm:top-12"
        />
      )}

      <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-roxo font-display text-sm text-white shadow-[0_0_0_5px_var(--color-ink),0_0_22px_-4px_rgba(109,40,217,0.8)] sm:h-12 sm:w-12">
        {i + 1}
      </div>

      <motion.div
        onMouseMove={onMouseMove}
        whileHover={{ x: 6 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="group/stop relative flex-1 overflow-hidden rounded-3xl border border-ink-line bg-ink-soft/60 p-7 transition-colors duration-300 hover:border-roxo-light/40 sm:p-9"
      >
        <motion.div
          aria-hidden
          style={{ background: glow }}
          className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-500 group-hover/stop:opacity-100"
        />
        <div className="relative z-10">
          <span className="text-xs font-medium uppercase tracking-widest text-roxo-light">
            {f.n}
          </span>
          <h3 className="mt-2 text-2xl font-medium tracking-tight">{f.title}</h3>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-gelo-dim">
            {f.body}
          </p>
        </div>
      </motion.div>
    </div>
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

        <div className="mt-16 flex flex-col">
          {fases.map((f, i) => (
            <Reveal key={f.n} delay={i * 0.08}>
              <Stop f={f} i={i} isLast={i === fases.length - 1} />
            </Reveal>
          ))}
        </div>

        <SectionCTA
          className="mt-10"
          label="Quero esse processo no meu negócio"
          message="Vi seu site. Quero esse processo de estrutura rodando no meu negócio. Por onde começa?"
        />
      </div>
    </section>
  );
}
