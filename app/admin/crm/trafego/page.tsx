import Link from "next/link";
import {
  BarChart3,
  MousePointerClick,
  Eye,
  Target as TargetIcon,
  DollarSign,
  PlugZap,
} from "lucide-react";
import { getMetaResumo } from "@/app/lib/trafego/meta";
import { getGoogleResumo } from "@/app/lib/trafego/google";
import {
  METRICS_ZERO,
  somaMetrics,
  ctr,
  cpl,
  brl,
  num,
  type TrafegoResumo,
  type TrafegoMetrics,
} from "@/app/lib/trafego/types";

export const dynamic = "force-dynamic";

type Aba = "meta" | "google" | "ambos";

const ABAS: { key: Aba; label: string }[] = [
  { key: "meta", label: "Meta" },
  { key: "google", label: "Google Ads" },
  { key: "ambos", label: "Meta + Google" },
];

function StatCard({
  label,
  valor,
  icon: Icon,
  accent,
}: {
  label: string;
  valor: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-ink-line bg-ink-soft/40 p-5">
      <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
      <div className="flex items-start justify-between gap-2">
        <div className="font-display text-3xl leading-none text-gelo">{valor}</div>
        <Icon className="h-5 w-5 shrink-0 text-gelo-dim" />
      </div>
      <div className="mt-2 text-xs uppercase tracking-wide text-gelo-dim">{label}</div>
    </div>
  );
}

function Metricas({ m }: { m: TrafegoMetrics }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      <StatCard label="Investido (30d)" valor={brl(m.gasto)} icon={DollarSign} accent="bg-emerald-400" />
      <StatCard label="Impressões" valor={num(m.impressoes)} icon={Eye} accent="bg-sky-400" />
      <StatCard label="Cliques" valor={num(m.cliques)} icon={MousePointerClick} accent="bg-violet-400" />
      <StatCard label="Conversões" valor={num(m.conversoes)} icon={TargetIcon} accent="bg-yellow-400" />
      <StatCard label="CTR" valor={`${ctr(m).toFixed(2)}%`} icon={BarChart3} accent="bg-roxo" />
      <StatCard label="CPL" valor={m.conversoes > 0 ? brl(cpl(m)) : "—"} icon={DollarSign} accent="bg-gelo/40" />
    </div>
  );
}

function ConectarNotice({
  plataforma,
  faltando,
}: {
  plataforma: string;
  faltando: string[];
}) {
  return (
    <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-6 text-sm leading-relaxed text-yellow-100/90">
      <p className="flex items-center gap-2 font-display text-lg uppercase text-gelo">
        <PlugZap className="h-5 w-5 text-yellow-300" />
        {plataforma} não conectado
      </p>
      <p className="mt-3">
        Defina as variáveis de ambiente na Vercel pra puxar os dados reais:
      </p>
      <ul className="mt-2 flex flex-col gap-1">
        {faltando.map((v) => (
          <li key={v}>
            <code className="text-roxo-light">{v}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ErroNotice({ plataforma, msg }: { plataforma: string; msg?: string }) {
  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 text-sm text-red-200/90">
      <p className="font-medium text-gelo">Erro ao buscar {plataforma}</p>
      <p className="mt-2">{msg ?? "Tenta de novo em instantes."}</p>
    </div>
  );
}

function PainelPlataforma({
  nome,
  resumo,
}: {
  nome: string;
  resumo: TrafegoResumo;
}) {
  if (resumo.status === "nao_configurado") {
    return <ConectarNotice plataforma={nome} faltando={resumo.faltando ?? []} />;
  }
  if (resumo.status === "erro") {
    return <ErroNotice plataforma={nome} msg={resumo.msg} />;
  }
  return <Metricas m={resumo.metrics ?? METRICS_ZERO} />;
}

export default async function TrafegoPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>;
}) {
  const { aba: abaRaw } = await searchParams;
  const aba: Aba =
    abaRaw === "google" || abaRaw === "ambos" ? (abaRaw as Aba) : "meta";

  // Busca só o que a aba precisa.
  const [meta, google] = await Promise.all([
    aba === "google" ? Promise.resolve<TrafegoResumo>({ status: "ok" }) : getMetaResumo(),
    aba === "meta" ? Promise.resolve<TrafegoResumo>({ status: "ok" }) : getGoogleResumo(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl uppercase">Tráfego</h1>
        <p className="mt-1 text-sm text-gelo-dim">
          Desempenho dos anúncios nos últimos 30 dias.
        </p>
      </div>

      <div className="flex gap-2 border-b border-ink-line">
        {ABAS.map((a) => {
          const ativo = a.key === aba;
          return (
            <Link
              key={a.key}
              href={`/admin/crm/trafego?aba=${a.key}`}
              className={`-mb-px border-b-2 px-4 py-2 text-sm transition-colors ${
                ativo
                  ? "border-roxo-light font-medium text-gelo"
                  : "border-transparent text-gelo-dim hover:text-gelo"
              }`}
            >
              {a.label}
            </Link>
          );
        })}
      </div>

      {aba === "meta" && <PainelPlataforma nome="Meta" resumo={meta} />}
      {aba === "google" && <PainelPlataforma nome="Google Ads" resumo={google} />}

      {aba === "ambos" && (
        <div className="flex flex-col gap-8">
          {meta.status === "ok" && google.status === "ok" ? (
            <div>
              <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-gelo">
                Consolidado
              </h2>
              <Metricas
                m={somaMetrics(
                  meta.metrics ?? METRICS_ZERO,
                  google.metrics ?? METRICS_ZERO,
                )}
              />
            </div>
          ) : null}

          <div>
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-gelo">
              Meta
            </h2>
            <PainelPlataforma nome="Meta" resumo={meta} />
          </div>
          <div>
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-gelo">
              Google Ads
            </h2>
            <PainelPlataforma nome="Google Ads" resumo={google} />
          </div>
        </div>
      )}
    </div>
  );
}
