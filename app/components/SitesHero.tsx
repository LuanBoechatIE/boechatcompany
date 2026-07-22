"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Magnetic } from "./Magnetic";
import { WA_AGENDAR } from "../lib/contato";

const ease = [0.22, 1, 0.36, 1] as const;
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
};

export function SitesHero() {
  return (
    <section className="relative flex min-h-[80vh] items-center overflow-hidden pt-32 pb-20">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-[720px] w-[720px] -translate-x-1/2 rounded-full bg-roxo-deep opacity-60 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-10%] top-1/3 h-[420px] w-[420px] rounded-full bg-roxo/20 blur-[120px]"
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto w-full max-w-7xl px-6"
      >
        <motion.h1
          variants={item}
          className="font-display text-[clamp(2.6rem,8vw,7.5rem)] uppercase text-balance"
        >
          Site não é cartão de visita
          <span className="text-roxo">.</span>
          <br />
          <span className="text-roxo-light">É vendedor 24h</span>
          <span className="text-roxo">.</span>
        </motion.h1>

        <motion.p
          variants={item}
          className="mt-8 max-w-2xl text-lg leading-relaxed text-gelo-dim sm:text-xl"
        >
          Cada site abaixo foi feito pra UM trabalho: transformar a próxima
          visita em cliente. Identidade própria, performance no teto, copy que
          vende sozinha.
        </motion.p>

        <motion.div variants={item} className="mt-10">
          <Magnetic className="inline-block">
            <a
              href={WA_AGENDAR}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-full bg-roxo px-7 py-4 text-base font-medium text-white shadow-[0_8px_40px_-12px_rgba(109,40,217,0.6)] transition-shadow duration-300 hover:shadow-[0_12px_60px_-12px_rgba(109,40,217,0.85)]"
            >
              Quero o meu site
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </a>
          </Magnetic>
        </motion.div>
      </motion.div>
    </section>
  );
}
