"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useRef } from "react";
import { Magnetic } from "./Magnetic";
import { MeshGradientBg } from "./MeshGradient";
import { whatsappLink } from "../lib/contato";

const ease = [0.22, 1, 0.36, 1] as const;
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
};

const WA_SITE = whatsappLink(
  "Oi, Boechat. Vi seu portfólio de sites e quero o meu.",
);

const provas = [
  { k: "+150", v: "sites no ar" },
  { k: "7 dias", v: "do briefing ao ar" },
  { k: "98/100", v: "Lighthouse médio" },
];

export function SitesHero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative flex min-h-[92vh] items-center overflow-hidden pt-32 pb-20"
    >
      <motion.div
        style={{ y: bgY }}
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
      >
        <MeshGradientBg />
      </motion.div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--color-ink)_78%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent"
      />

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 mx-auto w-full max-w-7xl px-6"
      >
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.span
            variants={item}
            className="block text-sm font-medium uppercase tracking-[0.2em] text-roxo-light"
          >
            {"/// Sites que vendem"}
          </motion.span>

          <motion.h1
            variants={item}
            className="mt-5 font-display text-[clamp(2.6rem,8vw,7.5rem)] uppercase leading-[0.9] text-balance"
          >
            Site não é cartão
            <br />
            de visita
            <span className="text-roxo">.</span>{" "}
            <span className="text-roxo-light">é vendedor 24h</span>
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
                href={WA_SITE}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full bg-roxo px-7 py-4 text-base font-medium text-white shadow-[0_8px_40px_-12px_rgba(109,40,217,0.6)] transition-shadow duration-300 hover:shadow-[0_12px_60px_-12px_rgba(109,40,217,0.85)]"
              >
                Quero o meu site
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </a>
            </Magnetic>
          </motion.div>

          <motion.div
            variants={item}
            className="mt-14 flex flex-wrap gap-x-10 gap-y-5 border-t border-ink-line/60 pt-8"
          >
            {provas.map((p) => (
              <div key={p.v}>
                <div className="font-display text-2xl text-gelo sm:text-3xl">
                  {p.k}
                </div>
                <div className="mt-1 text-xs uppercase tracking-wide text-gelo-dim">
                  {p.v}
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
