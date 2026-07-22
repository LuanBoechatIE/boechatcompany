"use client";

import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { Eye, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Reveal } from "./Reveal";
import { MockSite, type Mock } from "./MockSite";

type Project = {
  name: string;
  category: string;
  resultado: string;
  mock: Mock;
  image?: string;
  previewImage?: string;
};

const projects: Project[] = [
  {
    name: "Filmmaker Protegido",
    category: "Infoproduto · Filmmakers",
    resultado: "Contrato vendido e entregue sem precisar de call",
    mock: { paper: "#0e0d0c", ink: "#f3ede2", accent: "#e0a83e", soft: "#1c1815" },
    image: "/sites/israel-filmmaker.webp",
    previewImage: "/sites/israel-filmmaker-full.webp",
  },
  {
    name: "Karine Viana",
    category: "Infoproduto · TikTok Shop",
    resultado: "Matrícula no curso batendo direto no checkout",
    mock: { paper: "#0b0b12", ink: "#f5f0fa", accent: "#ff2d78", soft: "#1c1430" },
    image: "/sites/karine-viana.webp",
    previewImage: "/sites/karine-viana-full.webp",
  },
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

function BrowserFrame({
  project,
  onPreview,
}: {
  project: Project;
  onPreview: (p: Project) => void;
}) {
  const hasPreview = Boolean(project.previewImage);

  return (
    <button
      type="button"
      onClick={() => hasPreview && onPreview(project)}
      disabled={!hasPreview}
      aria-label={hasPreview ? `Ver preview do site ${project.name}` : project.name}
      className={`group/frame w-full overflow-hidden rounded-2xl border border-ink-line bg-ink-soft text-left shadow-[0_40px_80px_-40px_rgba(0,0,0,0.8)] transition-colors duration-300 ${
        hasPreview ? "cursor-pointer hover:border-roxo-light/40" : "cursor-default"
      }`}
    >
      <div className="flex items-center gap-2 border-b border-ink-line/60 bg-ink px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <div className="ml-3 h-5 flex-1 max-w-[220px] rounded-full bg-white/[0.06]" />
      </div>
      <div className="relative aspect-[16/10] overflow-hidden">
        {project.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.image}
            alt={`Site ${project.name}`}
            loading="lazy"
            className="h-full w-full object-cover object-top transition-transform duration-500 group-hover/frame:scale-[1.03]"
          />
        ) : (
          <MockSite m={project.mock} />
        )}

        {hasPreview && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-ink/0 opacity-0 transition-all duration-300 group-hover/frame:bg-ink/60 group-hover/frame:opacity-100">
            <span className="flex items-center gap-2 rounded-full bg-roxo px-5 py-2.5 text-sm font-medium text-white">
              <Eye className="h-4 w-4" />
              Ver preview
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

function PreviewModal({ project, onClose }: { project: Project; onClose: () => void }) {
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/90 p-3 backdrop-blur-sm sm:p-8"
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-ink-line bg-ink-soft shadow-[0_60px_120px_-40px_rgba(0,0,0,0.9)]"
      >
        <div className="flex items-center justify-between gap-4 border-b border-ink-line/60 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="font-display truncate text-lg uppercase">{project.name}</div>
            <div className="text-xs uppercase tracking-widest text-roxo-light">
              {project.category}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar preview"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink-line text-gelo-dim transition-colors hover:border-roxo-light/50 hover:text-gelo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto bg-ink">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.previewImage}
            alt={`Preview completo do site ${project.name}`}
            className="w-full"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

function ProjectRow({
  project,
  index,
  onPreview,
}: {
  project: Project;
  index: number;
  onPreview: (p: Project) => void;
}) {
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
      <BrowserFrame project={project} onPreview={onPreview} />

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
  const [previewing, setPreviewing] = useState<Project | null>(null);

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
            <ProjectRow key={p.name} project={p} index={i} onPreview={setPreviewing} />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {previewing && (
          <PreviewModal project={previewing} onClose={() => setPreviewing(null)} />
        )}
      </AnimatePresence>
    </section>
  );
}
