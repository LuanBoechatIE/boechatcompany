import "server-only";
import {
  METRICS_ZERO,
  type TrafegoResumo,
  type TrafegoMetrics,
  type TrafegoSeriePonto,
  type TrafegoCampanha,
} from "./types";

type GoogleMetricsRow = {
  metrics?: {
    cost_micros?: number | string;
    impressions?: number | string;
    clicks?: number | string;
    conversions?: number | string;
    conversions_value?: number | string;
  };
  segments?: { date?: string };
  campaign?: { name?: string };
};

function n(v: number | string | undefined): number {
  return Number(v ?? 0);
}

function acumular(alvo: TrafegoMetrics, r: GoogleMetricsRow): void {
  alvo.gasto += n(r.metrics?.cost_micros) / 1_000_000;
  alvo.impressoes += n(r.metrics?.impressions);
  alvo.cliques += n(r.metrics?.clicks);
  alvo.conversoes += n(r.metrics?.conversions);
  alvo.leads += n(r.metrics?.conversions);
  alvo.receita += n(r.metrics?.conversions_value);
}

// Google Ads não devolve "reach" diretamente por conta; deixamos em 0.
function novoZero(): TrafegoMetrics {
  return { ...METRICS_ZERO };
}

// Painel do Google Ads para um cliente, no intervalo pedido.
export async function getGooglePainel(
  dados: Record<string, string>,
  segredos: Record<string, string>,
  from: string,
  to: string,
): Promise<TrafegoResumo> {
  const customerId = dados.customerId?.replace(/-/g, "").trim();
  const managerId = dados.managerId?.replace(/-/g, "").trim();
  const { developerToken, clientId, clientSecret, refreshToken } = segredos;

  const faltando: string[] = [];
  if (!customerId) faltando.push("Customer ID");
  if (!developerToken) faltando.push("Developer Token");
  if (!clientId) faltando.push("Client ID");
  if (!clientSecret) faltando.push("Client Secret");
  if (!refreshToken) faltando.push("Refresh Token");
  if (faltando.length > 0) return { status: "nao_configurado", faltando };

  try {
    const { GoogleAdsApi } = await import("google-ads-api");
    const client = new GoogleAdsApi({
      client_id: clientId!,
      client_secret: clientSecret!,
      developer_token: developerToken!,
    });
    const customer = client.Customer({
      customer_id: customerId!,
      login_customer_id: managerId || customerId!,
      refresh_token: refreshToken!,
    });

    const where = `WHERE segments.date BETWEEN '${from}' AND '${to}'`;
    const [linhasDia, linhasCampanha] = await Promise.all([
      customer.query(`
        SELECT metrics.clicks, metrics.impressions, metrics.cost_micros,
               metrics.conversions, metrics.conversions_value, segments.date
        FROM customer ${where}
      `) as Promise<GoogleMetricsRow[]>,
      customer.query(`
        SELECT campaign.name, metrics.clicks, metrics.impressions,
               metrics.cost_micros, metrics.conversions, metrics.conversions_value
        FROM campaign ${where}
      `) as Promise<GoogleMetricsRow[]>,
    ]);

    const metrics = novoZero();
    const porDia = new Map<string, TrafegoSeriePonto>();
    for (const r of linhasDia) {
      acumular(metrics, r);
      const dia = r.segments?.date ?? from;
      const p = porDia.get(dia) ?? { data: dia, gasto: 0, cliques: 0, conversoes: 0 };
      p.gasto += n(r.metrics?.cost_micros) / 1_000_000;
      p.cliques += n(r.metrics?.clicks);
      p.conversoes += n(r.metrics?.conversions);
      porDia.set(dia, p);
    }
    const serie = [...porDia.values()].sort((a, b) => a.data.localeCompare(b.data));

    const porCampanha = new Map<string, TrafegoCampanha>();
    for (const r of linhasCampanha) {
      const nome = r.campaign?.name ?? "Campanha";
      const c =
        porCampanha.get(nome) ??
        { nome, gasto: 0, impressoes: 0, cliques: 0, conversoes: 0 };
      c.gasto += n(r.metrics?.cost_micros) / 1_000_000;
      c.impressoes += n(r.metrics?.impressions);
      c.cliques += n(r.metrics?.clicks);
      c.conversoes += n(r.metrics?.conversions);
      porCampanha.set(nome, c);
    }
    const campanhas = [...porCampanha.values()]
      .sort((a, b) => b.gasto - a.gasto)
      .slice(0, 10);

    return { status: "ok", metrics, serie, campanhas };
  } catch (e) {
    return {
      status: "erro",
      msg: e instanceof Error ? e.message : "Falha no Google Ads.",
    };
  }
}
