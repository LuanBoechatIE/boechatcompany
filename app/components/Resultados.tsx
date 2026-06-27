"use client";

import { Reveal } from "./Reveal";
import { CountUp } from "./KPI";

const kpis = [
  {
    label: "Pipeline gerado",
    prefix: "+R$ ",
    value: 2,
    decimals: 0,
    suffix: " mi",
    sub: "soma do que rodou nos clientes",
  },
  {
    label: "ROI médio dos clientes",
    prefix: "",
    value: 4.5,
    decimals: 1,
    suffix: "x",
    sub: "receita gerada por real investido",
  },
  {
    label: "Clientes atendidos",
    prefix: "",
    value: 12,
    decimals: 0,
    suffix: "",
    sub: "negócios estruturados até aqui",
  },
  {
    label: "Receita média / cliente",
    prefix: "R$ ",
    value: 180,
    decimals: 0,
    suffix: " k",
    sub: "ticket médio gerado no período",
  },
];

const cases = [
  {
    name: "🔲 Cliente exemplo 1",
    nicho: "🔲 nicho",
    antes:
      "Status anterior. Onde travava (pipeline parado, conversão baixa, dependência de indicação, etc.).",
    depois:
      "O que mudou depois da estrutura (números, taxa de conversão, ticket, recorrência).",
    metrica: { k: "+0%", v: "em receita / pipeline / conversão" },
  },
  {
    name: "🔲 Cliente exemplo 2",
    nicho: "🔲 nicho",
    antes: "Status anterior do negócio.",
    depois: "Resultado depois de implementar a estrutura.",
    metrica: { k: "+0x", v: "no ROI do investimento" },
  },
  {
    name: "🔲 Cliente exemplo 3",
    nicho: "🔲 nicho",
    antes: "Diagnóstico inicial.",
    depois: "Resultado mensurado.",
    metrica: { k: "R$ 0", v: "novos / mês" },
  },
];

export function Resultados() {
  return (
    <section
      id="resultados"
      className="border-t border-ink-line/60 py-28 sm:py-40"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-end gap-10 sm:grid-cols-[1.4fr_1fr]">
          <Reveal>
            <span className="text-sm font-medium uppercase tracking-[0.2em] text-roxo-light">
              Resultado, não promessa
            </span>
            <h2 className="mt-4 font-display text-[clamp(2rem,5vw,4.2rem)] uppercase leading-[0.98] text-balance">
              O que importa é o que entrou
              <br />
              na conta no fim do mês
              <span className="text-roxo">.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-lg leading-relaxed text-gelo-dim">
              Cada projeto vira número: pipeline gerado, taxa de conversão,
              receita atribuída. Meus cases falam com cifrão.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-ink-line bg-ink-line sm:grid-cols-2 lg:grid-cols-4">
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

        <div className="mt-20">
          <Reveal>
            <h3 className="font-display text-[clamp(1.6rem,3.5vw,2.8rem)] uppercase leading-[1] text-balance">
              Onde estavam.
              <br />
              Onde chegaram
              <span className="text-roxo">.</span>
            </h3>
          </Reveal>

          <div className="mt-10 flex flex-col gap-6">
            {cases.map((c, i) => (
              <Reveal key={c.name} delay={i * 0.08}>
                <article className="grid gap-px overflow-hidden rounded-3xl border border-ink-line bg-ink-line md:grid-cols-[1fr_2fr_1fr]">
                  <div className="bg-ink p-7 sm:p-9">
                    <div className="text-xs font-medium uppercase tracking-widest text-gelo-dim">
                      Cliente
                    </div>
                    <div className="mt-3 font-display text-xl uppercase sm:text-2xl">
                      {c.name}
                    </div>
                    <div className="mt-1 text-sm text-gelo-dim">{c.nicho}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-px bg-ink-line">
                    <div className="bg-ink p-7 sm:p-9">
                      <div className="text-xs font-medium uppercase tracking-widest text-gelo-dim">
                        Antes
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-gelo-dim sm:text-base">
                        {c.antes}
                      </p>
                    </div>
                    <div className="bg-ink-soft p-7 sm:p-9">
                      <div className="text-xs font-medium uppercase tracking-widest text-roxo-light">
                        Depois
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-gelo sm:text-base">
                        {c.depois}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center bg-ink p-7 sm:p-9">
                    <div className="font-display text-4xl text-roxo-light sm:text-5xl">
                      {c.metrica.k}
                    </div>
                    <div className="mt-2 text-sm text-gelo-dim">
                      {c.metrica.v}
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
