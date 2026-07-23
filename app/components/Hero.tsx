"use client";

import { m, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useRef } from "react";
import { WA_AGENDAR } from "../lib/contato";
import { Magnetic } from "./Magnetic";
import { Marquee } from "./Marquee";
import { MeshGradientBg } from "./MeshGradientLazy";

const ease = [0.22, 1, 0.36, 1] as const;

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
};

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const glowY = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section
      ref={ref}
      id="top"
      className="relative flex min-h-screen items-center overflow-hidden pt-32 pb-20"
    >
      <m.div
        style={{ y: glowY }}
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
      >
        <MeshGradientBg />
      </m.div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--color-ink)_78%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-ink to-transparent"
      />

      <m.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 mx-auto w-full max-w-7xl px-6"
      >
        <m.div variants={container} initial="hidden" animate="show">
          <m.h1
            variants={item}
            className="font-display text-[clamp(2.4rem,7vw,6.5rem)] uppercase text-balance"
          >
            Venda mais<span className="text-roxo">.</span>
            <br />
            <span className="text-roxo-light">
              sem gastar mais em anúncio
            </span>
            <span className="text-roxo">.</span>
          </m.h1>

          <m.p
            variants={item}
            className="mt-8 max-w-2xl text-lg leading-relaxed text-gelo-dim sm:text-xl"
          >
            Anúncio traz gente. Não traz venda. Quem transforma clique em cliente é{" "}
            <span className="text-gelo">estrutura</span>: posicionamento,
            presença e um caminho feito pra converter. Eu construo a sua e faço
            cada real que você já gasta render mais.
          </m.p>

          <m.div variants={item} className="mt-10">
            <Magnetic className="inline-block">
              <a
                href={WA_AGENDAR}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full bg-roxo px-7 py-4 text-base font-medium text-white shadow-[0_8px_40px_-12px_rgba(109,40,217,0.6)] transition-shadow duration-300 hover:shadow-[0_12px_60px_-12px_rgba(109,40,217,0.85)]"
              >
                Quero vender mais
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </a>
            </Magnetic>
          </m.div>
        </m.div>
      </m.div>

      <div className="absolute inset-x-0 bottom-0 z-10">
        <Marquee />
      </div>
    </section>
  );
}
