// Tipos compartilhados do painel de Tráfego (Meta + Google Ads).

export type TrafegoMetrics = {
  gasto: number; // em R$
  impressoes: number;
  alcance: number;
  cliques: number;
  conversoes: number;
  leads: number;
  receita: number; // em R$ (valor atribuído às conversões)
};

export type TrafegoSeriePonto = {
  data: string; // YYYY-MM-DD
  gasto: number;
  cliques: number;
  conversoes: number;
};

export type TrafegoCampanha = {
  nome: string;
  gasto: number;
  impressoes: number;
  cliques: number;
  conversoes: number;
};

export type TrafegoResumo = {
  status: "ok" | "nao_configurado" | "erro";
  msg?: string;
  faltando?: string[];
  metrics?: TrafegoMetrics;
  serie?: TrafegoSeriePonto[];
  campanhas?: TrafegoCampanha[];
};

export const METRICS_ZERO: TrafegoMetrics = {
  gasto: 0,
  impressoes: 0,
  alcance: 0,
  cliques: 0,
  conversoes: 0,
  leads: 0,
  receita: 0,
};

export function somaMetrics(a: TrafegoMetrics, b: TrafegoMetrics): TrafegoMetrics {
  return {
    gasto: a.gasto + b.gasto,
    impressoes: a.impressoes + b.impressoes,
    alcance: a.alcance + b.alcance,
    cliques: a.cliques + b.cliques,
    conversoes: a.conversoes + b.conversoes,
    leads: a.leads + b.leads,
    receita: a.receita + b.receita,
  };
}

// Junta duas séries por data (usada no consolidado Meta + Google).
export function somaSeries(
  a: TrafegoSeriePonto[],
  b: TrafegoSeriePonto[],
): TrafegoSeriePonto[] {
  const mapa = new Map<string, TrafegoSeriePonto>();
  for (const p of [...a, ...b]) {
    const atual = mapa.get(p.data);
    if (atual) {
      atual.gasto += p.gasto;
      atual.cliques += p.cliques;
      atual.conversoes += p.conversoes;
    } else {
      mapa.set(p.data, { ...p });
    }
  }
  return [...mapa.values()].sort((x, y) => x.data.localeCompare(y.data));
}

export function ctr(m: TrafegoMetrics): number {
  return m.impressoes > 0 ? (m.cliques / m.impressoes) * 100 : 0;
}

export function cpc(m: TrafegoMetrics): number {
  return m.cliques > 0 ? m.gasto / m.cliques : 0;
}

// Custo por mil impressões.
export function cpm(m: TrafegoMetrics): number {
  return m.impressoes > 0 ? (m.gasto / m.impressoes) * 1000 : 0;
}

// Custo por lead.
export function cpl(m: TrafegoMetrics): number {
  return m.leads > 0 ? m.gasto / m.leads : 0;
}

// Custo por conversão.
export function custoConversao(m: TrafegoMetrics): number {
  return m.conversoes > 0 ? m.gasto / m.conversoes : 0;
}

// Retorno sobre o investimento em anúncios.
export function roas(m: TrafegoMetrics): number {
  return m.gasto > 0 ? m.receita / m.gasto : 0;
}

export const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const num = (n: number) => Math.round(n).toLocaleString("pt-BR");
