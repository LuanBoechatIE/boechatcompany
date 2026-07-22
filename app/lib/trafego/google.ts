import "server-only";
import type { TrafegoResumo, TrafegoMetrics } from "./types";

const REQUIRED = [
  "GOOGLE_ADS_DEVELOPER_TOKEN",
  "GOOGLE_ADS_CLIENT_ID",
  "GOOGLE_ADS_CLIENT_SECRET",
  "GOOGLE_ADS_REFRESH_TOKEN",
  "GOOGLE_ADS_LOGIN_CUSTOMER_ID",
  "GOOGLE_ADS_CUSTOMER_ID",
];

// Resumo dos últimos 30 dias da conta do Google Ads (agregado da conta).
export async function getGoogleResumo(): Promise<TrafegoResumo> {
  const faltando = REQUIRED.filter((v) => !process.env[v]);
  if (faltando.length > 0) return { status: "nao_configurado", faltando };

  try {
    const { GoogleAdsApi } = await import("google-ads-api");
    const client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    });
    const customer = client.Customer({
      customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID!.replace(/-/g, ""),
      login_customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID!.replace(/-/g, ""),
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
    });

    const rows = await customer.query(`
      SELECT
        metrics.clicks,
        metrics.impressions,
        metrics.cost_micros,
        metrics.conversions
      FROM customer
      WHERE segments.date DURING LAST_30_DAYS
    `);

    const metrics: TrafegoMetrics = {
      gasto: 0,
      impressoes: 0,
      cliques: 0,
      conversoes: 0,
    };
    for (const r of rows) {
      metrics.gasto += (Number(r.metrics?.cost_micros ?? 0)) / 1_000_000;
      metrics.impressoes += Number(r.metrics?.impressions ?? 0);
      metrics.cliques += Number(r.metrics?.clicks ?? 0);
      metrics.conversoes += Number(r.metrics?.conversions ?? 0);
    }
    return { status: "ok", metrics };
  } catch (e) {
    return { status: "erro", msg: e instanceof Error ? e.message : "Falha no Google Ads." };
  }
}
