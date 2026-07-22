import "server-only";
import type { TrafegoResumo, TrafegoMetrics } from "./types";

const REQUIRED = ["META_ACCESS_TOKEN", "META_AD_ACCOUNT_ID"];
const GRAPH = "https://graph.facebook.com/v21.0";

type MetaAction = { action_type: string; value: string };
type MetaInsight = {
  spend?: string;
  impressions?: string;
  clicks?: string;
  actions?: MetaAction[];
};

// Ações que contam como conversão/lead pra Meta.
const CONV_ACTIONS = new Set([
  "lead",
  "onsite_conversion.lead_grouped",
  "offsite_conversion.fb_pixel_lead",
  "offsite_conversion.fb_pixel_purchase",
  "purchase",
]);

// Resumo dos últimos 30 dias da conta de anúncios da Meta (Facebook/Instagram).
export async function getMetaResumo(): Promise<TrafegoResumo> {
  const faltando = REQUIRED.filter((v) => !process.env[v]);
  if (faltando.length > 0) return { status: "nao_configurado", faltando };

  try {
    const raw = process.env.META_AD_ACCOUNT_ID!.trim();
    const actId = raw.startsWith("act_") ? raw : `act_${raw}`;
    const params = new URLSearchParams({
      fields: "spend,impressions,clicks,actions",
      date_preset: "last_30d",
      access_token: process.env.META_ACCESS_TOKEN!,
    });
    const res = await fetch(`${GRAPH}/${actId}/insights?${params.toString()}`, {
      cache: "no-store",
    });
    const json = (await res.json()) as {
      data?: MetaInsight[];
      error?: { message: string };
    };
    if (json.error) return { status: "erro", msg: json.error.message };

    const row = json.data?.[0];
    const metrics: TrafegoMetrics = {
      gasto: Number(row?.spend ?? 0),
      impressoes: Number(row?.impressions ?? 0),
      cliques: Number(row?.clicks ?? 0),
      conversoes: (row?.actions ?? [])
        .filter((a) => CONV_ACTIONS.has(a.action_type))
        .reduce((s, a) => s + Number(a.value ?? 0), 0),
    };
    return { status: "ok", metrics };
  } catch (e) {
    return { status: "erro", msg: e instanceof Error ? e.message : "Falha na Meta." };
  }
}
