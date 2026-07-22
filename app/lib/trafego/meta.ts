import "server-only";
import {
  METRICS_ZERO,
  type TrafegoResumo,
  type TrafegoMetrics,
  type TrafegoSeriePonto,
  type TrafegoCampanha,
} from "./types";

const GRAPH = "https://graph.facebook.com/v21.0";

type MetaAction = { action_type: string; value: string };
type MetaInsight = {
  date_start?: string;
  campaign_name?: string;
  spend?: string;
  impressions?: string;
  reach?: string;
  clicks?: string;
  actions?: MetaAction[];
  action_values?: MetaAction[];
};

// Ações que contam como conversão pra Meta.
const CONV_ACTIONS = new Set([
  "lead",
  "onsite_conversion.lead_grouped",
  "offsite_conversion.fb_pixel_lead",
  "offsite_conversion.fb_pixel_purchase",
  "purchase",
]);
// Subconjunto que conta especificamente como lead.
const LEAD_ACTIONS = new Set([
  "lead",
  "onsite_conversion.lead_grouped",
  "offsite_conversion.fb_pixel_lead",
]);
const REVENUE_ACTIONS = new Set([
  "purchase",
  "offsite_conversion.fb_pixel_purchase",
]);

function somaAcoes(acoes: MetaAction[] | undefined, filtro: Set<string>): number {
  return (acoes ?? [])
    .filter((a) => filtro.has(a.action_type))
    .reduce((s, a) => s + Number(a.value ?? 0), 0);
}

function insightParaMetrics(row: MetaInsight): TrafegoMetrics {
  return {
    gasto: Number(row.spend ?? 0),
    impressoes: Number(row.impressions ?? 0),
    alcance: Number(row.reach ?? 0),
    cliques: Number(row.clicks ?? 0),
    conversoes: somaAcoes(row.actions, CONV_ACTIONS),
    leads: somaAcoes(row.actions, LEAD_ACTIONS),
    receita: somaAcoes(row.action_values, REVENUE_ACTIONS),
  };
}

function normalizarConta(raw: string): string {
  const id = raw.trim();
  return id.startsWith("act_") ? id : `act_${id}`;
}

async function fetchInsights(
  actId: string,
  token: string,
  from: string,
  to: string,
  extra: Record<string, string>,
): Promise<MetaInsight[]> {
  const params = new URLSearchParams({
    fields: "spend,impressions,reach,clicks,actions,action_values",
    time_range: JSON.stringify({ since: from, until: to }),
    access_token: token,
    limit: "500",
    ...extra,
  });
  const res = await fetch(`${GRAPH}/${actId}/insights?${params.toString()}`, {
    cache: "no-store",
  });
  const json = (await res.json()) as {
    data?: MetaInsight[];
    error?: { message: string };
  };
  if (json.error) throw new Error(json.error.message);
  return json.data ?? [];
}

// Painel da Meta para um cliente específico, no intervalo pedido.
// `dados`/`segredos` vêm da integração do cliente (decriptados no server).
export async function getMetaPainel(
  dados: Record<string, string>,
  segredos: Record<string, string>,
  from: string,
  to: string,
): Promise<TrafegoResumo> {
  const token = segredos.accessToken?.trim();
  const conta = dados.adAccountId?.trim();
  const faltando: string[] = [];
  if (!conta) faltando.push("ID da conta de anúncios");
  if (!token) faltando.push("Access Token");
  if (faltando.length > 0) return { status: "nao_configurado", faltando };

  try {
    const actId = normalizarConta(conta!);
    const [total, porDia, porCampanha] = await Promise.all([
      fetchInsights(actId, token!, from, to, {}),
      fetchInsights(actId, token!, from, to, { time_increment: "1" }),
      fetchInsights(actId, token!, from, to, { level: "campaign" }),
    ]);

    const metrics = total[0] ? insightParaMetrics(total[0]) : METRICS_ZERO;

    const serie: TrafegoSeriePonto[] = porDia
      .map((r) => {
        const m = insightParaMetrics(r);
        return {
          data: r.date_start ?? from,
          gasto: m.gasto,
          cliques: m.cliques,
          conversoes: m.conversoes,
        };
      })
      .sort((a, b) => a.data.localeCompare(b.data));

    const campanhas: TrafegoCampanha[] = porCampanha
      .map((r) => {
        const m = insightParaMetrics(r);
        return {
          nome: r.campaign_name ?? "Campanha",
          gasto: m.gasto,
          impressoes: m.impressoes,
          cliques: m.cliques,
          conversoes: m.conversoes,
        };
      })
      .sort((a, b) => b.gasto - a.gasto)
      .slice(0, 10);

    return { status: "ok", metrics, serie, campanhas };
  } catch (e) {
    return {
      status: "erro",
      msg: e instanceof Error ? e.message : "Falha na Meta.",
    };
  }
}
