"use client";

import { m } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Reveal } from "./Reveal";
import { WA_AGENDAR } from "../lib/contato";
import { SpotlightGlow } from "./SpotlightGlow";

type Servico = {
  n: string;
  title: string;
  body: string;
  tags: string[];
  icon: React.ReactNode;
};

const stroke = "currentColor";
const sw = 1.5;

const IconEngenharia = (
  <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 20h18" />
    <path d="M6 20V10" />
    <path d="M11 20V6" />
    <path d="M16 20V13" />
    <path d="M21 20V4" />
  </svg>
);
const IconPipeline = (
  <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="4" width="18" height="6" rx="1.5" />
    <rect x="3" y="14" width="13" height="6" rx="1.5" />
    <path d="M7 7h.01M7 17h.01" />
  </svg>
);
const IconAtendimento = (
  <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);
const IconAquisicao = (
  <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 17l6-6 4 4 8-8" />
    <path d="M14 7h7v7" />
  </svg>
);

const servicos: Servico[] = [
  {
    n: "01",
    title: "Engenharia comercial",
    body: "Oferta, processo e KPIs desenhados pra fechar. Tira a venda do improviso e bota num trilho que escala.",
    tags: [
      "Estruturação de processo",
      "Playbook de vendas",
      "Treinamento de time",
      "Funil & qualificação",
      "Gestão de pipeline",
    ],
    icon: IconEngenharia,
  },
  {
    n: "02",
    title: "Pipeline & operação",
    body: "Cada lead virando número no painel. CRM no jeito, dashboards que falam, integração com o que já roda.",
    tags: [
      "Implementação de CRM",
      "Dashboard customizado",
      "Automação de etapas",
      "Integração total",
      "Gestão de leads",
    ],
    icon: IconPipeline,
  },
  {
    n: "03",
    title: "Atendimento & conversão",
    body: "Lead que chega não dorme. Resposta rápida, qualificação no automático, follow-up sem depender da memória.",
    tags: [
      "WhatsApp comercial",
      "Atendimento 24h",
      "Qualificação de leads",
      "Follow-up estruturado",
      "Respostas rápidas",
    ],
    icon: IconAtendimento,
  },
  {
    n: "04",
    title: "Aquisição & presença",
    body: "Outbound, mídia paga, site e conteúdo trabalhando juntos. Você aparece pra quem importa, do jeito que impõe respeito.",
    tags: [
      "Meta & Google Ads",
      "Tráfego pago especializado",
      "Sites & SEO",
      "Design & branding",
      "Apresentações comerciais",
    ],
    icon: IconAquisicao,
  },
];

function Card({ s, i }: { s: Servico; i: number }) {
  return (
    <Reveal delay={i * 0.08}>
      <SpotlightGlow className="h-full overflow-hidden rounded-3xl">
        <m.a
          href={WA_AGENDAR}
          target="_blank"
          rel="noopener noreferrer"
          whileHover="hover"
          className="group flex h-full flex-col rounded-3xl border border-ink-line bg-ink-soft/40 p-8 transition-colors duration-300 hover:border-roxo-light/50 sm:p-10"
        >
          <div className="flex items-start justify-between gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink text-roxo-light [&_svg]:h-6 [&_svg]:w-6">
              {s.icon}
            </span>
            <span className="font-display text-sm text-gelo-dim/70">{s.n}</span>
          </div>

          <h3 className="mt-7 text-2xl font-medium tracking-tight sm:text-[1.7rem]">
            {s.title}
          </h3>
          <p className="mt-3 text-base leading-relaxed text-gelo-dim">
            {s.body}
          </p>

          <ul className="mt-6 flex flex-wrap gap-2">
            {s.tags.map((t) => (
              <li
                key={t}
                className="inline-flex items-center gap-1.5 rounded-full border border-ink-line bg-ink/60 px-3 py-1 text-xs text-gelo-dim"
              >
                <span className="text-roxo-light">/</span> {t}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex items-center justify-between border-t border-ink-line/60 pt-6">
            <span className="text-sm text-gelo-dim">Quero estruturar isso</span>
            <m.span
              variants={{ hover: { x: 6 } }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-roxo text-white"
            >
              <ArrowRight className="h-4 w-4" />
            </m.span>
          </div>
        </m.a>
      </SpotlightGlow>
    </Reveal>
  );
}

export function Servicos() {
  return (
    <section
      id="servicos"
      className="relative border-t border-ink-line/60 py-28 sm:py-40"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-end gap-10 sm:grid-cols-[1.4fr_1fr]">
          <Reveal>
            <span className="text-sm font-medium uppercase tracking-[0.2em] text-roxo-light">
              {"/// Serviços"}
            </span>
            <h2 className="mt-4 font-display text-[clamp(2rem,5vw,4.2rem)] uppercase leading-[0.98] text-balance">
              Soluções pra cada etapa do seu{" "}
              <span className="text-roxo-light">crescimento</span>
              <span className="text-roxo">.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-lg leading-relaxed text-gelo-dim">
              Tudo modular. Você pega o que falta, eu encaixo no que já roda.
              Sem &ldquo;pacote fechado&rdquo;.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {servicos.map((s, i) => (
            <Card key={s.title} s={s} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
