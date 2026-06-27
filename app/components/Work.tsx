"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Reveal } from "./Reveal";
import { MockSite, type Mock } from "./MockSite";

type Project = {
  name: string;
  category: string;
  mock: Mock;
};

const projects: Project[] = [
  {
    name: "Clínica Lumière",
    category: "Estética & Saúde",
    mock: { paper: "#fdf6f2", ink: "#3a2a2f", accent: "#d98a9e", soft: "#f3e3df" },
  },
  {
    name: "Vértice Advocacia",
    category: "Direito empresarial",
    mock: { paper: "#10141f", ink: "#e8ecf5", accent: "#c8a24a", soft: "#1b2233" },
  },
  {
    name: "Studio Nórdico",
    category: "Arquitetura",
    mock: { paper: "#f4f4f1", ink: "#2c302b", accent: "#7d8a6f", soft: "#e4e5df" },
  },
  {
    name: "NovaFit",
    category: "Performance & Academia",
    mock: { paper: "#0d0f12", ink: "#f0f3f5", accent: "#b6f24a", soft: "#181b20" },
  },
  {
    name: "Atelier Marê",
    category: "Moda autoral",
    mock: { paper: "#faf3ec", ink: "#3b2f28", accent: "#c96f44", soft: "#efe2d6" },
  },
  {
    name: "Lumen Odonto",
    category: "Odontologia",
    mock: { paper: "#ffffff", ink: "#13283a", accent: "#2b8fb0", soft: "#e7f1f5" },
  },
];

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 0.45, 1], [0.9, 1, 0.97]);
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.25, 0.85, 1],
    [0.25, 1, 1, 0.4],
  );
  const imgY = useTransform(scrollYProgress, [0, 1], ["8%", "-8%"]);

  return (
    <motion.div
      ref={ref}
      style={{ scale, opacity }}
      className="origin-center"
    >
      <div className="mb-5 flex items-end justify-between gap-4">
        <div className="flex items-baseline gap-4">
          <span className="font-display text-lg text-roxo-light">
            {String(index + 1).padStart(2, "0")}
          </span>
          <h3 className="font-display text-2xl uppercase sm:text-3xl">
            {project.name}
          </h3>
        </div>
        <span className="hidden text-sm text-gelo-dim sm:block">
          {project.category}
        </span>
      </div>

      <motion.div
        whileHover="hover"
        className="group relative aspect-[16/10] cursor-pointer overflow-hidden rounded-2xl border border-ink-line"
      >
        <motion.div
          style={{ y: imgY }}
          variants={{ hover: { scale: 1.05 } }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-[-8%]"
        >
          <MockSite m={project.mock} />
        </motion.div>

        <motion.div
          variants={{ hover: { opacity: 1 } }}
          initial={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 flex items-end justify-between gap-4 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent p-6 sm:p-8"
        >
          <span className="text-base text-gelo sm:hidden">
            {project.category}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-roxo px-5 py-2.5 text-sm font-medium text-white">
            Ver projeto →
          </span>
        </motion.div>
      </motion.div>
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
              Trabalhos
            </span>
            <h2 className="mt-4 font-display text-[clamp(2.2rem,6vw,5rem)] uppercase text-balance">
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

        <div className="mt-20 flex flex-col gap-24 sm:gap-32">
          {projects.map((p, i) => (
            <ProjectCard key={p.name} project={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
