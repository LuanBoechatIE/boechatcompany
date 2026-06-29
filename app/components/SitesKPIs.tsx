"use client";

import { Reveal } from "./Reveal";
import { CountUp } from "./KPI";

const kpis = [
  {
    label: "Sites entregues",
    prefix: "+",
    value: 150,
    decimals: 0,
    suffix: "",
    sub: "negócios com presença que vende",
  },
  {
    label: "Tempo médio de entrega",
    prefix: "",
    value: 7,
    decimals: 0,
    suffix: " dias",
    sub: "do briefing ao no ar",
  },
  {
    label: "Satisfação",
    prefix: "",
    value: 97,
    decimals: 0,
    suffix: "%",
    sub: "clientes que recomendam",
  },
  {
    label: "Performance média",
    prefix: "",
    value: 98,
    decimals: 0,
    suffix: "/100",
    sub: "lighthouse mobile",
  },
];

export function SitesKPIs() {
  return (
    <section className="border-t border-ink-line/60 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <span className="text-sm font-medium uppercase tracking-[0.2em] text-roxo-light">
            Números
          </span>
          <h2 className="mt-4 max-w-3xl font-display text-[clamp(1.8rem,4.5vw,3.4rem)] uppercase leading-[1] text-balance">
            O que está por trás
            <br />
            de cada projeto
            <span className="text-roxo">.</span>
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-ink-line bg-ink-line sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k, i) => (
            <Reveal
              key={k.label}
              delay={i * 0.08}
              className="bg-ink p-8 sm:p-10"
            >
              <div className="text-sm font-medium uppercase tracking-widest text-gelo-dim">
                {k.label}
              </div>
              <div className="mt-5 font-display text-4xl text-roxo-light sm:text-5xl">
                <CountUp
                  to={k.value}
                  prefix={k.prefix}
                  suffix={k.suffix}
                  decimals={k.decimals}
                  duration={2.2}
                />
              </div>
              <div className="mt-4 text-xs text-gelo-dim/70">{k.sub}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
