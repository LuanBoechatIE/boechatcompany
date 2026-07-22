// Tipos compartilhados do painel de Tráfego (Meta + Google Ads).

export type TrafegoMetrics = {
  gasto: number; // em R$
  impressoes: number;
  cliques: number;
  conversoes: number;
};

export type TrafegoResumo = {
  status: "ok" | "nao_configurado" | "erro";
  msg?: string;
  faltando?: string[];
  metrics?: TrafegoMetrics;
};

export const METRICS_ZERO: TrafegoMetrics = {
  gasto: 0,
  impressoes: 0,
  cliques: 0,
  conversoes: 0,
};

export function somaMetrics(a: TrafegoMetrics, b: TrafegoMetrics): TrafegoMetrics {
  return {
    gasto: a.gasto + b.gasto,
    impressoes: a.impressoes + b.impressoes,
    cliques: a.cliques + b.cliques,
    conversoes: a.conversoes + b.conversoes,
  };
}

export function ctr(m: TrafegoMetrics): number {
  return m.impressoes > 0 ? (m.cliques / m.impressoes) * 100 : 0;
}

export function cpc(m: TrafegoMetrics): number {
  return m.cliques > 0 ? m.gasto / m.cliques : 0;
}

export function cpl(m: TrafegoMetrics): number {
  return m.conversoes > 0 ? m.gasto / m.conversoes : 0;
}

export const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const num = (n: number) =>
  Math.round(n).toLocaleString("pt-BR");
