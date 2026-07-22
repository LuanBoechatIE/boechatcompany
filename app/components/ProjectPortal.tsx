"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ExternalLink,
  Maximize2,
  Minimize2,
  Monitor,
  Smartphone,
  X,
} from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Mock } from "./MockSite";

export type Project = {
  name: string;
  category: string;
  resultado: string;
  mock: Mock;
  /** thumbnail do card (recorte do hero) */
  image?: string;
  /** print de página inteira em desktop (rolável no portal) */
  desktopShot?: string;
  /** print de página inteira em mobile (só se o site tiver mobile bom) */
  mobileShot?: string;
  /** site real, pro botão "abrir em nova aba" (opt-in) */
  url?: string;
};

type Device = "desktop" | "mobile";

const springLayout = { type: "spring", stiffness: 260, damping: 32 } as const;
const springWidth = { type: "spring", stiffness: 210, damping: 28 } as const;

const MOBILE_WIDTH = 400;

function IconBtn({
  onClick,
  label,
  active,
  children,
}: {
  onClick: () => void;
  label: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
        active
          ? "bg-roxo/20 text-roxo-light"
          : "text-gelo-dim hover:bg-ink-line/60 hover:text-gelo"
      }`}
    >
      {children}
    </button>
  );
}

export function ProjectPortal({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const [device, setDevice] = useState<Device>("desktop");
  const [expanded, setExpanded] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [areaWidth, setAreaWidth] = useState(0);

  const hasMobile = Boolean(project.mobileShot);
  const shot =
    device === "mobile" && project.mobileShot
      ? project.mobileShot
      : project.desktopShot;
  const domain = project.url
    ? project.url.replace(/^https?:\/\//, "").replace(/\/$/, "")
    : project.name.toLowerCase();

  // Mede a área de conteúdo pra saber quanto o "desktop" ocupa.
  useLayoutEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const update = () => setAreaWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [expanded]);

  // Volta o scroll pro topo ao trocar de dispositivo.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [device]);

  // Trava o scroll do fundo + ESC pra fechar.
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

  const framed = device === "mobile";
  const targetWidth =
    device === "mobile"
      ? Math.min(MOBILE_WIDTH, areaWidth || MOBILE_WIDTH)
      : areaWidth || undefined;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[100]"
    >
      {/* Fundo: escurece + desfoca o resto da página */}
      <motion.div
        initial={{ backdropFilter: "blur(0px)" }}
        animate={{ backdropFilter: "blur(14px)" }}
        exit={{ backdropFilter: "blur(0px)" }}
        transition={{ duration: 0.4 }}
        onClick={onClose}
        className="absolute inset-0 bg-ink/80"
      />

      <div
        onClick={onClose}
        className={`relative flex h-full w-full items-center justify-center ${
          expanded ? "p-0" : "p-3 sm:p-6"
        }`}
      >
        {/* O "navegador" — mesmo layoutId do card, então cresce a partir dele */}
        <motion.div
          layoutId={`portal-${project.name}`}
          onClick={(e) => e.stopPropagation()}
          transition={reduce ? { duration: 0.2 } : springLayout}
          style={{ borderRadius: expanded ? 0 : 18 }}
          className={`flex h-full w-full flex-col overflow-hidden border border-ink-line bg-ink shadow-[0_60px_140px_-40px_rgba(0,0,0,0.9)] ${
            expanded ? "max-w-none" : "max-w-[1320px]"
          }`}
        >
          {/* Toolbar do navegador */}
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0 : 0.18, duration: 0.3 }}
            className="flex shrink-0 items-center gap-3 border-b border-ink-line/70 bg-ink-soft/60 px-3 py-2.5 sm:px-4"
          >
            <div className="hidden items-center gap-1.5 sm:flex">
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            </div>

            {/* Barra de endereço */}
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-ink-line bg-ink px-3 py-1.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
              <span className="truncate text-xs text-gelo-dim">{domain}</span>
            </div>

            {/* Toggle de dispositivo (só quando o site tem mobile bom) */}
            {hasMobile && (
              <div className="hidden items-center gap-0.5 rounded-lg border border-ink-line bg-ink p-0.5 md:flex">
                <IconBtn
                  label="Desktop"
                  active={device === "desktop"}
                  onClick={() => setDevice("desktop")}
                >
                  <Monitor className="h-4 w-4" />
                </IconBtn>
                <IconBtn
                  label="Mobile"
                  active={device === "mobile"}
                  onClick={() => setDevice("mobile")}
                >
                  <Smartphone className="h-4 w-4" />
                </IconBtn>
              </div>
            )}

            <div className="flex items-center gap-0.5">
              <IconBtn
                label={expanded ? "Reduzir" : "Tela cheia"}
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </IconBtn>
              {project.url && (
                <IconBtn
                  label="Abrir em nova aba"
                  onClick={() => window.open(project.url, "_blank", "noopener,noreferrer")}
                >
                  <ExternalLink className="h-4 w-4" />
                </IconBtn>
              )}
              <IconBtn label="Fechar" onClick={onClose}>
                <X className="h-4 w-4" />
              </IconBtn>
            </div>
          </motion.div>

          {/* Área do preview (print rolável) */}
          <div
            ref={areaRef}
            className="relative flex flex-1 justify-center overflow-hidden bg-ink"
          >
            <motion.div
              animate={{ width: targetWidth ?? "100%" }}
              transition={reduce ? { duration: 0.2 } : springWidth}
              style={{ width: targetWidth ?? "100%" }}
              className={`relative h-full overflow-hidden bg-ink-soft ${
                framed
                  ? "my-4 rounded-[26px] border border-ink-line shadow-[0_30px_60px_-30px_rgba(0,0,0,0.8)]"
                  : ""
              }`}
            >
              <div
                ref={scrollRef}
                className="h-full w-full overflow-y-auto [scrollbar-width:thin]"
              >
                <AnimatePresence mode="wait">
                  <motion.img
                    key={shot}
                    src={shot}
                    alt={`Site ${project.name}${device === "mobile" ? " (mobile)" : ""}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="block w-full"
                  />
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
