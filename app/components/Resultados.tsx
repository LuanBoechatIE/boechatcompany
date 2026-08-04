"use client";

import { Reveal } from "./Reveal";
import { CountUp } from "./KPI";
import { SectionCTA } from "./SectionCTA";

// `lead` marca o número que sustenta a seção. Ele vem maior que os outros de
// propósito: os quatro no mesmo tamanho faziam o menor puxar o maior pra baixo.
const kpis = [
  {
    label: "Pipeline gerado",
    prefix: "+R$ ",
    value: 2,
    decimals: 0,
    suffix: " mi",
    sub: "soma do que rodou nos clientes",
    lead: true,
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
    name: "Xonados Pizza",
    nicho: "Pizzaria",
    logo: "/cases/xonados.webp",
    antes:
      "Refém de aplicativo de entrega: até 30% de cada pedido ia embora em comissão. Sem canal próprio, sem cardápio online decente e sem nenhum jeito de o cliente pedir direto.",
    depois:
      "Site com cardápio e pedido direto no WhatsApp, presença que passa fome de longe. O cliente passou a comprar fora do app e a margem voltou pro caixa.",
    metrica: { k: "+240%", v: "em pedidos diretos, fora dos apps" },
  },
  {
    name: "Armazém dos Vidros",
    nicho: "Vidraçaria",
    logo: "/cases/armazem.webp",
    antes:
      "Vivia de boca a boca e orçamento por telefone. Quem pesquisava online não achava nada, e os concorrentes com site fechavam o cliente antes mesmo do contato.",
    depois:
      "Catálogo online com pedido de orçamento estruturado. Os pedidos passaram a chegar prontos, qualificados, sem perder tempo no telefone.",
    metrica: { k: "4x", v: "mais orçamentos por mês" },
  },
  {
    name: "Burger Smash",
    nicho: "Hamburgueria",
    logo: "/cases/burger-smash.webp",
    antes:
      "Produto excelente, presença amadora. Perfil largado, sem site, dependendo 100% do movimento de rua e do impulso de quem passava na frente.",
    depois:
      "Marca redesenhada e site pensado pra converter, com pedido direto e prova social na frente. Virou referência no bairro e parou de depender de sorte.",
    metrica: { k: "+R$ 50k", v: "em faturamento / mês" },
  },
];

function Case({ c, delay }: { c: (typeof cases)[number]; delay: number }) {
  return (
    <Reveal delay={delay}>
      <article
        className="group/case relative overflow-hidden rounded-3xl border border-ink-line p-7 transition-colors duration-500 hover:border-roxo-light/35 sm:p-10"
        // O card clareia da esquerda pra direita: começa no passado e termina
        // sob o número. A viagem do case está no próprio fundo, sem precisar
        // de seta desenhada.
        style={{
          background:
            "linear-gradient(105deg, var(--color-ink) 0%, var(--color-ink) 52%, rgba(109,40,217,0.11) 100%)",
        }}
      >
        {/* Identidade à esquerda, resultado à direita: o olho entra no cliente
            e sai no número, que é o que precisa ficar. */}
        <div className="flex flex-col gap-6 border-b border-ink-line/70 pb-7 sm:flex-row sm:items-center sm:justify-between sm:gap-10">
          <div className="flex items-center gap-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={c.logo}
              alt={`Logo ${c.name}`}
              loading="lazy"
              className="h-14 w-auto max-w-[120px] shrink-0 object-contain object-left"
            />
            <div className="min-w-0">
              <div className="font-display text-xl uppercase leading-tight sm:text-2xl">
                {c.name}
              </div>
              <div className="mt-1 text-sm text-gelo-dim">{c.nicho}</div>
            </div>
          </div>

          <div className="sm:text-right">
            <div className="font-display leading-[0.9] text-roxo-light text-[clamp(2.8rem,6vw,4.4rem)]">
              {c.metrica.k}
            </div>
            <div className="mt-2 max-w-[16rem] text-sm text-gelo-dim sm:ml-auto">
              {c.metrica.v}
            </div>
          </div>
        </div>

        {/* Antes recua, depois avança. A diferença de peso É o conteúdo: antes
            era o passado, e passado não disputa atenção com o resultado. */}
        <div className="mt-7 grid gap-7 md:grid-cols-2 md:gap-10">
          <div>
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-gelo-dim/50">
              Antes
            </span>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-gelo-dim/55">
              {c.antes}
            </p>
          </div>
          <div className="border-l-2 border-roxo/60 pl-6">
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-roxo-light">
              Depois
            </span>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-gelo">
              {c.depois}
            </p>
          </div>
        </div>
      </article>
    </Reveal>
  );
}

export function Resultados() {
  const [lead, ...resto] = kpis;

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

        {/* Sem caixa: dois fios seguram o bloco. A tabela de células iguais
            competia com os três cards de case logo abaixo. */}
        <div className="mt-14 border-y border-ink-line py-10 sm:py-12">
          <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr_1fr_1fr] lg:gap-12">
            <Reveal className="lg:border-r lg:border-ink-line lg:pr-12">
              <div className="text-sm font-medium uppercase tracking-widest text-gelo-dim">
                {lead.label}
              </div>
              <div className="mt-4 font-display leading-[0.9] text-roxo-light text-[clamp(3.2rem,7vw,5rem)]">
                <CountUp
                  to={lead.value}
                  prefix={lead.prefix}
                  suffix={lead.suffix}
                  decimals={lead.decimals}
                  duration={2.2}
                />
              </div>
              <div className="mt-4 text-sm text-gelo-dim/70">{lead.sub}</div>
            </Reveal>

            {resto.map((k, i) => (
              <Reveal key={k.label} delay={0.08 + i * 0.08}>
                <div className="text-sm font-medium uppercase tracking-widest text-gelo-dim">
                  {k.label}
                </div>
                <div className="mt-4 font-display text-[2.4rem] leading-[0.9] text-gelo sm:text-[2.75rem]">
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

        <div className="mt-20">
          <Reveal>
            <h3 className="font-display text-[clamp(1.6rem,3.5vw,2.8rem)] uppercase leading-[1] text-balance">
              Onde estavam.
              <br />
              Onde chegaram
              <span className="text-roxo">.</span>
            </h3>
          </Reveal>

          <div className="mt-10 flex flex-col gap-5">
            {cases.map((c, i) => (
              <Case key={c.name} c={c} delay={i * 0.08} />
            ))}
          </div>

          <SectionCTA
            className="mt-12"
            label="Quero ser o próximo case"
            message="Vi seu site e os cases. Quero ser o próximo resultado. Como a gente começa?"
          />
        </div>
      </div>
    </section>
  );
}
