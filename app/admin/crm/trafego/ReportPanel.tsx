"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  METRICS_ZERO,
  somaMetrics,
  somaSeries,
  ctr,
  cpc,
  cpm,
  cpl,
  custoConversao,
  roas,
  brl,
  num,
  type TrafegoResumo,
  type TrafegoMetrics,
} from "@/app/lib/trafego/types";
import { formatarData } from "@/app/lib/trafego/periodo";

const COR = {
  roxo: "#6d28d9",
  roxoLight: "#a78bfa",
  meta: "#3b82f6",
  google: "#22c55e",
  linha: "#2c2340",
  eixo: "#c9c4d6",
};

export type ReportPanelProps = {
  clienteNome: string;
  clienteId: string; // já formatado (000123)
  clienteLogo: string | null; // data URL ou vazio
  boechatLogo: string; // /logo/....png
  periodoLabel: string;
  geradoEmLabel: string;
  meta: TrafegoResumo;
  google: TrafegoResumo;
  exportMode?: boolean;
};

function iniciais(nome: string): string {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function Kpi({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="rounded-2xl border border-ink-line bg-ink-soft/40 p-4">
      <div className="font-display text-2xl leading-none text-gelo">{valor}</div>
      <div className="mt-2 text-[11px] uppercase tracking-wide text-gelo-dim">
        {label}
      </div>
    </div>
  );
}

function kpisDe(m: TrafegoMetrics): { label: string; valor: string }[] {
  return [
    { label: "Investimento", valor: brl(m.gasto) },
    { label: "Impressões", valor: num(m.impressoes) },
    { label: "Alcance", valor: m.alcance > 0 ? num(m.alcance) : "—" },
    { label: "Cliques", valor: num(m.cliques) },
    { label: "CTR", valor: `${ctr(m).toFixed(2)}%` },
    { label: "CPC", valor: m.cliques > 0 ? brl(cpc(m)) : "—" },
    { label: "CPM", valor: m.impressoes > 0 ? brl(cpm(m)) : "—" },
    { label: "Conversões", valor: num(m.conversoes) },
    { label: "Leads", valor: num(m.leads) },
    { label: "Custo/lead", valor: m.leads > 0 ? brl(cpl(m)) : "—" },
    { label: "Custo/conv.", valor: m.conversoes > 0 ? brl(custoConversao(m)) : "—" },
    { label: "Receita", valor: m.receita > 0 ? brl(m.receita) : "—" },
    { label: "ROAS", valor: m.gasto > 0 && m.receita > 0 ? `${roas(m).toFixed(2)}x` : "—" },
  ];
}

function SecaoTitulo({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-gelo-dim">
      {children}
    </h3>
  );
}

export function ReportPanel(props: ReportPanelProps) {
  const {
    clienteNome,
    clienteId,
    clienteLogo,
    boechatLogo,
    periodoLabel,
    geradoEmLabel,
    meta,
    google,
    exportMode = false,
  } = props;

  const metaOk = meta.status === "ok";
  const googleOk = google.status === "ok";
  const metaM = meta.metrics ?? METRICS_ZERO;
  const googleM = google.metrics ?? METRICS_ZERO;
  const consolidado = somaMetrics(
    metaOk ? metaM : METRICS_ZERO,
    googleOk ? googleM : METRICS_ZERO,
  );
  const temDados = metaOk || googleOk;

  const serie = somaSeries(
    metaOk ? meta.serie ?? [] : [],
    googleOk ? google.serie ?? [] : [],
  ).map((p) => ({ ...p, dataLabel: formatarData(p.data).slice(0, 5) }));

  const compara = [
    { plataforma: "Meta", Investimento: metaOk ? metaM.gasto : 0, Conversões: metaOk ? metaM.conversoes : 0 },
    { plataforma: "Google", Investimento: googleOk ? googleM.gasto : 0, Conversões: googleOk ? googleM.conversoes : 0 },
  ];

  const campanhas = [
    ...(metaOk ? (meta.campanhas ?? []).map((c) => ({ ...c, origem: "Meta" })) : []),
    ...(googleOk ? (google.campanhas ?? []).map((c) => ({ ...c, origem: "Google" })) : []),
  ]
    .sort((a, b) => b.gasto - a.gasto)
    .slice(0, 12);

  const alturaGrafico = exportMode ? 260 : 240;

  return (
    <div className="flex flex-col gap-8 rounded-3xl border border-ink-line bg-ink p-8">
      {/* ── Cabeçalho do relatório ──────────────────────────────── */}
      <header className="grid grid-cols-[1fr_auto] items-start gap-6 border-b border-ink-line pb-6">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.3em] text-roxo-light">
            Relatório de Tráfego
          </p>
          <h2 className="mt-2 font-display text-3xl uppercase text-gelo">
            {clienteNome}
          </h2>
          <dl className="mt-3 grid gap-x-8 gap-y-1 text-sm text-gelo-dim sm:grid-cols-2">
            <div>
              <span className="text-gelo-dim/60">ID do cliente: </span>
              {clienteId}
            </div>
            <div>
              <span className="text-gelo-dim/60">Período: </span>
              {periodoLabel}
            </div>
            <div>
              <span className="text-gelo-dim/60">Gerado em: </span>
              {geradoEmLabel}
            </div>
          </dl>
        </div>

        {/* Coluna exclusiva pra logo do cliente */}
        <div className="flex h-24 w-40 items-center justify-center">
          {clienteLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={clienteLogo}
              alt={`Logo ${clienteNome}`}
              className="max-h-24 max-w-40 object-contain"
              style={{ objectFit: "contain" }}
              crossOrigin="anonymous"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-ink-line bg-ink-soft/40 font-display text-xl text-gelo-dim">
              {iniciais(clienteNome) || "?"}
            </div>
          )}
        </div>
      </header>

      {/* ── Conteúdo ─────────────────────────────────────────────── */}
      {!temDados ? (
        <div className="rounded-2xl border border-dashed border-ink-line bg-ink-soft/20 p-10 text-center text-sm text-gelo-dim">
          Nenhuma integração conectada com dados neste período. Configure Meta ou
          Google Ads na aba <strong className="text-gelo">Configurações</strong> do
          cliente.
        </div>
      ) : (
        <>
          <section>
            <SecaoTitulo>Consolidado (Meta + Google)</SecaoTitulo>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
              {kpisDe(consolidado).map((k) => (
                <Kpi key={k.label} label={k.label} valor={k.valor} />
              ))}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-ink-line bg-ink-soft/20 p-5">
              <SecaoTitulo>Investimento por dia</SecaoTitulo>
              <ResponsiveContainer width="100%" height={alturaGrafico}>
                <AreaChart data={serie} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gGasto" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COR.roxoLight} stopOpacity={0.5} />
                      <stop offset="100%" stopColor={COR.roxoLight} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={COR.linha} />
                  <XAxis dataKey="dataLabel" stroke={COR.eixo} fontSize={11} tickLine={false} />
                  <YAxis stroke={COR.eixo} fontSize={11} tickLine={false} width={48} />
                  {!exportMode && (
                    <Tooltip
                      contentStyle={{ background: "#211a31", border: "1px solid #2c2340", borderRadius: 12, color: "#f3f1f7" }}
                      formatter={(v) => brl(Number(v))}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="gasto"
                    name="Investimento"
                    stroke={COR.roxoLight}
                    fill="url(#gGasto)"
                    strokeWidth={2}
                    isAnimationActive={!exportMode}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl border border-ink-line bg-ink-soft/20 p-5">
              <SecaoTitulo>Meta vs Google</SecaoTitulo>
              <ResponsiveContainer width="100%" height={alturaGrafico}>
                <BarChart data={compara} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COR.linha} />
                  <XAxis dataKey="plataforma" stroke={COR.eixo} fontSize={11} tickLine={false} />
                  <YAxis stroke={COR.eixo} fontSize={11} tickLine={false} width={48} />
                  {!exportMode && (
                    <Tooltip
                      contentStyle={{ background: "#211a31", border: "1px solid #2c2340", borderRadius: 12, color: "#f3f1f7" }}
                    />
                  )}
                  <Legend wrapperStyle={{ fontSize: 11, color: COR.eixo }} />
                  <Bar dataKey="Investimento" fill={COR.meta} radius={[6, 6, 0, 0]} isAnimationActive={!exportMode} />
                  <Bar dataKey="Conversões" fill={COR.google} radius={[6, 6, 0, 0]} isAnimationActive={!exportMode} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {campanhas.length > 0 && (
            <section>
              <SecaoTitulo>Campanhas</SecaoTitulo>
              <div className="overflow-hidden rounded-2xl border border-ink-line">
                <table className="w-full text-left text-sm">
                  <thead className="bg-ink-soft/40 text-[11px] uppercase tracking-wide text-gelo-dim">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Campanha</th>
                      <th className="px-4 py-2.5 font-medium">Origem</th>
                      <th className="px-4 py-2.5 text-right font-medium">Investido</th>
                      <th className="px-4 py-2.5 text-right font-medium">Impressões</th>
                      <th className="px-4 py-2.5 text-right font-medium">Cliques</th>
                      <th className="px-4 py-2.5 text-right font-medium">Conversões</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campanhas.map((c, i) => (
                      <tr key={`${c.origem}-${c.nome}-${i}`} className="border-t border-ink-line/60">
                        <td className="max-w-[280px] truncate px-4 py-2.5 text-gelo">{c.nome}</td>
                        <td className="px-4 py-2.5 text-gelo-dim">{c.origem}</td>
                        <td className="px-4 py-2.5 text-right text-gelo">{brl(c.gasto)}</td>
                        <td className="px-4 py-2.5 text-right text-gelo-dim">{num(c.impressoes)}</td>
                        <td className="px-4 py-2.5 text-right text-gelo-dim">{num(c.cliques)}</td>
                        <td className="px-4 py-2.5 text-right text-gelo">{num(c.conversoes)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}

      {/* ── Rodapé exclusivo das marcas ──────────────────────────── */}
      <footer className="mt-2 flex items-center justify-between gap-4 border-t border-ink-line pt-6">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={boechatLogo} alt="Boechat Company" className="h-8 w-auto object-contain" />
          <span className="text-xs text-gelo-dim/70">
            Relatório gerado pelo sistema Boechat
          </span>
        </div>
        <span className="text-xs text-gelo-dim/60">
          Cliente ID: {clienteId} · {periodoLabel}
        </span>
      </footer>
    </div>
  );
}
