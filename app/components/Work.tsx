"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Reveal } from "./Reveal";
import { MockSite, type Mock } from "./MockSite";

type Project = {
  name: string;
  category: string;
  resultado: string;
  mock: Mock;
};

const projects: Project[] = [
  {
    name: "Clínica Lumière",
    category: "Estética & Saúde",
    resultado: "Agenda de avaliação direto no WhatsApp",
    mock: { paper: "#fdf6f2", ink: "#3a2a2f", accent: "#d98a9e", soft: "#f3e3df" },
  },
  {
    name: "Vértice Advocacia",
    category: "Direito empresarial",
    resultado: "Autoridade que fecha antes da primeira reunião",
    mock: { paper: "#10141f", ink: "#e8ecf5", accent: "#c8a24a", soft: "#1b2233" },
  },
  {
    name: "Studio Nórdico",
    category: "Arquitetura",
    resultado: "Portfólio que vende o projeto pelo valor certo",
    mock: { paper: "#f4f4f1", ink: "#2c302b", accent: "#7d8a6f", soft: "#e4e5df" },
  },
  {
    name: "NovaFit",
    category: "Performance & Academia",
    resultado: "Matrícula online sem depender da recepção",
    mock: { paper: "#0d0f12", ink: "#f0f3f5", accent: "#b6f24a", soft: "#181b20" },
  },
  {
    name: "Atelier Marê",
    category: "Moda autoral",
    resultado: "Coleção que converte visita em pedido",
    mock: { paper: "#faf3ec", ink: "#3b2f28", accent: "#c96f44", soft: "#efe2d6" },
  },
  {
    name: "Lumen Odonto",
    category: "Odontologia",
    resultado: "Paciente que agenda no primeiro contato",
    mock: { paper: "#ffffff", ink: "#13283a", accent: "#2b8fb0", soft: "#e7f1f5" },
  },
];

function BrowserFrame({ mock }: { mock: Mock }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-line bg-ink-soft shadow-[0_40px_80px_-40px_rgba(0,0,0,0.8)]">
      <div className="flex items-center gap-2 border-b border-ink-line/60 bg-ink px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <div className="ml-3 h-5 flex-1 max-w-[220px] rounded-full bg-white/[0.06]" />
      </div>
      <div className="aspect-[16/10]">
        <MockSite m={mock} />
      </div>
    </div>
  );
}

function ProjectRow({ project, index }: { project: Project; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [60, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [0, 1]);
  const reversed = index % 2 === 1;

  return (
    <motion.div
      ref={ref}
      style={{ y, opacity }}
      className={`grid items-center gap-8 lg:grid-cols-[1.5fr_1fr] lg:gap-14 ${
        reversed ? "lg:[&>*:first-child]:order-2" : ""
      }`}
    >
      <BrowserFrame mock={project.mock} />

      <div>
        <span className="font-display text-5xl text-roxo-light/40">
          {String(index + 1).padStart(2, "0")}
        </span>
        <h3 className="mt-3 font-display text-3xl uppercase leading-none sm:text-4xl">
          {project.name}
        </h3>
        <div className="mt-2 text-sm uppercase tracking-widest text-roxo-light">
          {project.category}
        </div>
        <p className="mt-5 text-lg leading-relaxed text-gelo-dim">
          {project.resultado}
          <span className="text-roxo">.</span>
        </p>
      </div>
    </motion.div>
  );
}

export function Work() {
  return (
    <section
      id="trabalho"
      className="relative border-t border-ink-line/60 py-28 sm:py-36"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <Reveal>
            <span className="text-sm font-medium uppercase tracking-[0.2em] text-roxo-light">
              {"/// Trabalhos"}
            </span>
            <h2 className="mt-4 font-display text-[clamp(2.2rem,6vw,5rem)] uppercase leading-[0.95] text-balance">
              Cada um, uma
              <br />
              identidade própria
              <span className="text-roxo">.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="max-w-sm text-lg leading-relaxed text-gelo-dim">
              Nada de template repetido. Cada negócio sai com a cara dele,
              pensado pra vender, não pra enfeitar.
            </p>
          </Reveal>
        </div>

        <div className="mt-20 flex flex-col gap-24 sm:gap-28">
          {projects.map((p, i) => (
            <ProjectRow key={p.name} project={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
