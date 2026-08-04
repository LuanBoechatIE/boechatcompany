"use client";

import { m } from "framer-motion";

// Ocupa o rodapé do Hero, onde antes rodava um marquee de palavras soltas
// ("Posicionamento", "Conversão"). Palavra abstrata não é prova; logo de
// cliente é. A prova mais forte do site estava só na seção 7, longe demais
// de quem decide na primeira tela.
const clientes = [
  { nome: "Xonados Pizza", logo: "/cases/xonados.webp" },
  { nome: "Armazém dos Vidros", logo: "/cases/armazem.webp" },
  { nome: "Burger Smash", logo: "/cases/burger-smash.webp" },
];

export function ProvaClientes() {
  return (
    <div className="relative border-y border-ink-line/60 bg-ink-soft/30 py-6 backdrop-blur-sm">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-roxo-light/40 to-transparent"
      />
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 px-6 sm:flex-row sm:gap-10">
        <span className="shrink-0 text-xs font-medium uppercase tracking-[0.2em] text-gelo-dim/70">
          Negócios que já rodam com estrutura
        </span>
        <ul className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
          {clientes.map((c, i) => (
            <m.li
              key={c.nome}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.logo}
                alt={c.nome}
                loading="lazy"
                className="h-9 w-auto max-w-[110px] object-contain opacity-75 transition-opacity duration-300 hover:opacity-100 sm:h-10"
              />
            </m.li>
          ))}
        </ul>
      </div>
    </div>
  );
}
