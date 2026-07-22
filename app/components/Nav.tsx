"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Wordmark } from "./Wordmark";
import { WA_AGENDAR } from "../lib/contato";
import { ScrambleText } from "./ScrambleText";

const links = [
  { href: "/#servicos", label: "Serviços" },
  { href: "/#metodo", label: "Método" },
  { href: "/#resultados", label: "Resultados" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between px-6 transition-all duration-300 ${
          scrolled
            ? "my-3 rounded-full border border-ink-line/80 bg-ink/70 py-3 backdrop-blur-xl"
            : "my-4 border border-transparent py-4"
        }`}
      >
        <a href="/" className="text-xl tracking-tight">
          <Wordmark />
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-gelo-dim transition-colors hover:text-gelo"
            >
              <ScrambleText text={l.label} />
            </a>
          ))}
        </nav>

        <a
          href={WA_AGENDAR}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative inline-flex items-center gap-2 rounded-full bg-roxo px-5 py-2.5 text-sm font-medium text-white transition-transform duration-200 hover:scale-[1.03]"
        >
          Falar comigo
          <span className="transition-transform duration-200 group-hover:translate-x-0.5">
            →
          </span>
        </a>
      </div>
    </motion.header>
  );
}
