"use client";

import {
  Fingerprint,
  Gauge,
  MessageCircle,
  PenLine,
  Smartphone,
  Timer,
} from "lucide-react";
import { Reveal } from "./Reveal";
import { SpotlightGlow } from "./SpotlightGlow";
import { SectionCTA } from "./SectionCTA";

const itens = [
  {
    icon: Fingerprint,
    title: "Identidade própria",
    body: "Nada de tema pronto. Cada site sai com a cara do seu negócio, feito pra impor respeito no seu mercado.",
  },
  {
    icon: PenLine,
    title: "Copy que vende",
    body: "Texto pensado pra converter, não pra enfeitar. Cada seção empurra o visitante pro próximo passo.",
  },
  {
    icon: MessageCircle,
    title: "Contato direto no WhatsApp",
    body: "Todo caminho do site leva pra uma conversa. O interessado te chama sem formulário, sem fricção.",
  },
  {
    icon: Gauge,
    title: "Lighthouse no teto",
    body: "Site rápido no mobile e no desktop. Cada décimo de segundo a mais é cliente que desiste.",
  },
  {
    icon: Smartphone,
    title: "Perfeito no celular",
    body: "A maioria vai te achar pelo telefone. O site é desenhado mobile-first, não adaptado depois.",
  },
  {
    icon: Timer,
    title: "No ar em dias, não meses",
    body: "Do briefing ao site publicado em poucos dias úteis. Você começa a receber contato rápido.",
  },
];

export function SitesOferta() {
  return (
    <section className="border-t border-ink-line/60 py-28 sm:py-40">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <span className="text-sm font-medium uppercase tracking-[0.2em] text-roxo-light">
            {"/// O que você recebe"}
          </span>
          <h2 className="mt-4 max-w-3xl font-display text-[clamp(2rem,5vw,4.2rem)] uppercase leading-[0.98] text-balance">
            Um site feito pra trabalhar
            <span className="text-roxo">.</span>
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {itens.map((it, i) => (
            <Reveal key={it.title} delay={i * 0.06}>
              <SpotlightGlow className="h-full rounded-3xl">
                <div className="flex h-full flex-col rounded-3xl border border-ink-line bg-ink-soft/40 p-7 transition-colors duration-300 hover:border-roxo-light/40">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-roxo-light">
                    <it.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-6 text-xl font-medium tracking-tight">
                    {it.title}
                  </h3>
                  <p className="mt-2 text-base leading-relaxed text-gelo-dim">
                    {it.body}
                  </p>
                </div>
              </SpotlightGlow>
            </Reveal>
          ))}
        </div>

        <SectionCTA
          className="mt-14"
          label="Quero um site desses"
          message="Oi, Boechat. Vi seu portfólio de sites e quero um site que trabalha por mim. Como começa?"
        />
      </div>
    </section>
  );
}
