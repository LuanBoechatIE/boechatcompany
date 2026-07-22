"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Reveal } from "./Reveal";
import { WA_AGENDAR } from "../lib/contato";
import { Magnetic } from "./Magnetic";
import { MeshGradientBg } from "./MeshGradient";

export function CTA() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const glow = useTransform(scrollYProgress, [0, 1], [-60, 60]);

  return (
    <section
      id="contato"
      ref={ref}
      className="relative overflow-hidden border-t border-ink-line/60 py-32 sm:py-48"
    >
      <motion.div
        style={{ y: glow }}
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-80"
      >
        <MeshGradientBg
          colors={["#171221", "#2e1065", "#4c1d95", "#6d28d9"]}
          speed={0.18}
          distortion={1}
          swirl={0.75}
        />
      </motion.div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--color-ink)_70%)]"
      />

      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
        <Reveal>
          <span className="text-sm font-medium uppercase tracking-[0.2em] text-roxo-light">
            Bora pra cima
          </span>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="mt-6 font-display text-[clamp(2.6rem,8vw,7rem)] uppercase leading-[0.95] text-balance">
            De que lado
            <br />
            você quer estar
            <span className="text-roxo">?</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mx-auto mt-8 max-w-xl text-lg leading-relaxed text-gelo-dim">
            Eu te mostro, sem compromisso, como seu negócio pode estar vendendo
            mais. Se fizer sentido, a gente trabalha junto. Se não, você fica com
            a ideia.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="mt-10 flex justify-center">
            <Magnetic className="inline-block">
              <a
                href={WA_AGENDAR}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full bg-roxo px-8 py-4 text-base font-medium text-white shadow-[0_8px_40px_-12px_rgba(109,40,217,0.6)] transition-shadow duration-300 hover:shadow-[0_12px_60px_-12px_rgba(109,40,217,0.85)]"
              >
                Falar comigo no WhatsApp
                <span className="transition-transform duration-200 group-hover:translate-x-1">
                  →
                </span>
              </a>
            </Magnetic>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
