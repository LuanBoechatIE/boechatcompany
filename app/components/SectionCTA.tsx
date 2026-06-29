"use client";

import { whatsappLink, WA_AGENDAR } from "../lib/contato";
import { Magnetic } from "./Magnetic";
import { Reveal } from "./Reveal";

type Props = {
  label: string;
  message?: string;
  align?: "left" | "center";
  /** usar em seção de fundo claro (ex.: Método) */
  onLight?: boolean;
  className?: string;
};

export function SectionCTA({
  label,
  message,
  align = "left",
  onLight = false,
  className = "",
}: Props) {
  const href = message ? whatsappLink(message) : WA_AGENDAR;

  return (
    <Reveal
      className={`${align === "center" ? "flex justify-center" : ""} ${className}`}
    >
      <Magnetic className="inline-block">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`group inline-flex items-center gap-2 rounded-full px-7 py-4 text-base font-medium transition-shadow duration-300 ${
            onLight
              ? "bg-ink text-gelo shadow-[0_8px_40px_-12px_rgba(23,18,33,0.5)] hover:shadow-[0_12px_60px_-12px_rgba(23,18,33,0.7)]"
              : "bg-roxo text-white shadow-[0_8px_40px_-12px_rgba(109,40,217,0.6)] hover:shadow-[0_12px_60px_-12px_rgba(109,40,217,0.85)]"
          }`}
        >
          {label}
          <span className="transition-transform duration-200 group-hover:translate-x-1">
            →
          </span>
        </a>
      </Magnetic>
    </Reveal>
  );
}
