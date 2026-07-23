// Lead Score automático (0-100), calculado por regras. Função pura para ser
// usada tanto na camada de dados (leads-data.ts) quanto nas server actions,
// que persistem o valor em leads.lead_score a cada mudança relevante.
//
// Composição do score:
//   Etapa do pipeline ......... 0-30  (quanto mais avançado, maior)
//   Valor estimado ............ 0-25  (potencial de receita)
//   Recência de interação ..... 0-25  (contato recente = mais quente)
//   Engajamento (nº contatos) . 0-20  (histórico de interações reais)

import type { LeadStatus } from "./types";

export type LeadScoreInput = {
  status: LeadStatus;
  valorEstimado: number | null;
  ultimaInteracaoEm: Date | null;
  numInteracoes: number;
};

const DIA = 24 * 60 * 60 * 1000;

const ETAPA_PONTOS: Record<LeadStatus, number> = {
  novo: 4,
  primeiro_contato: 10,
  qualificado: 18,
  proposta: 24,
  negociacao: 30,
  convertido: 30,
  perdido: 0,
};

function pontosValor(valor: number | null): number {
  if (!valor || valor <= 0) return 0;
  if (valor >= 20000) return 25;
  if (valor >= 10000) return 20;
  if (valor >= 5000) return 15;
  if (valor >= 2000) return 10;
  return 5;
}

function pontosRecencia(ultima: Date | null, now: number): number {
  if (!ultima) return 0;
  const dias = (now - ultima.getTime()) / DIA;
  if (dias <= 1) return 25;
  if (dias <= 3) return 20;
  if (dias <= 7) return 14;
  if (dias <= 15) return 8;
  if (dias <= 30) return 4;
  return 0;
}

function pontosEngajamento(n: number): number {
  if (n >= 8) return 20;
  if (n >= 5) return 15;
  if (n >= 3) return 10;
  if (n >= 1) return 5;
  return 0;
}

export function computeLeadScore(
  input: LeadScoreInput,
  now: number = Date.now(),
): number {
  if (input.status === "perdido") return 0;
  const total =
    ETAPA_PONTOS[input.status] +
    pontosValor(input.valorEstimado) +
    pontosRecencia(input.ultimaInteracaoEm, now) +
    pontosEngajamento(input.numInteracoes);
  return Math.max(0, Math.min(100, Math.round(total)));
}

// Temperatura derivada do score, pra indicadores visuais no card.
export type Temperatura = "quente" | "morno" | "frio";

export function temperaturaDoScore(score: number): Temperatura {
  if (score >= 70) return "quente";
  if (score >= 40) return "morno";
  return "frio";
}
