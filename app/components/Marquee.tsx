"use client";

import { motion } from "framer-motion";

const items = [
  "Posicionamento",
  "Presença afiada",
  "Estrutura comercial",
  "Conversão",
  "Pipeline",
  "Atendimento 24h",
  "Aquisição",
  "Crescimento",
];

function Row() {
  return (
    <div className="flex shrink-0 items-center gap-10 px-5">
      {items.map((m) => (
        <span
          key={m}
          className="inline-flex items-center gap-3 whitespace-nowrap text-sm text-gelo-dim"
        >
          <span className="text-roxo-light">/</span>
          {m}
        </span>
      ))}
    </div>
  );
}

export function Marquee() {
  return (
    <div className="overflow-hidden border-t border-ink-line/60 bg-ink/40 py-4 backdrop-blur-sm [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <motion.div
        className="flex w-max"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 40, ease: "linear", repeat: Infinity }}
      >
        <Row />
        <Row />
        <Row />
        <Row />
      </motion.div>
    </div>
  );
}
