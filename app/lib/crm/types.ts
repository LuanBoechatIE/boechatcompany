// Tipos, status e labels do CRM/gestão interna.

export type LeadStatus = "novo" | "contato" | "proposta" | "ganho" | "perdido";

export const LEAD_STATUS: { key: LeadStatus; label: string; dot: string }[] = [
  { key: "novo", label: "Novo", dot: "bg-sky-400" },
  { key: "contato", label: "Em contato", dot: "bg-yellow-400" },
  { key: "proposta", label: "Proposta", dot: "bg-violet-400" },
  { key: "ganho", label: "Ganho", dot: "bg-emerald-400" },
  { key: "perdido", label: "Perdido", dot: "bg-red-400" },
];

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = Object.fromEntries(
  LEAD_STATUS.map((s) => [s.key, s.label]),
) as Record<LeadStatus, string>;

export type TarefaStatus = "todo" | "doing" | "review" | "done";

export const TAREFA_STATUS: { key: TarefaStatus; label: string }[] = [
  { key: "todo", label: "A fazer" },
  { key: "doing", label: "Fazendo" },
  { key: "review", label: "Revisão" },
  { key: "done", label: "Concluído" },
];

export type DemandaStatus = "backlog" | "andamento" | "revisao" | "concluido";

export const DEMANDA_STATUS: { key: DemandaStatus; label: string }[] = [
  { key: "backlog", label: "Backlog" },
  { key: "andamento", label: "Em andamento" },
  { key: "revisao", label: "Revisão" },
  { key: "concluido", label: "Concluído" },
];

export type ProjetoStatus =
  | "planejamento"
  | "andamento"
  | "revisao"
  | "concluido";

export const PROJETO_STATUS_LABEL: Record<ProjetoStatus, string> = {
  planejamento: "Planejamento",
  andamento: "Em andamento",
  revisao: "Revisão",
  concluido: "Concluído",
};

export type Prioridade = "baixa" | "media" | "alta" | "urgente";

export const PRIORIDADE_CLS: Record<Prioridade, string> = {
  baixa: "text-gelo-dim border-ink-line",
  media: "text-sky-200/90 border-sky-500/30",
  alta: "text-yellow-200/90 border-yellow-500/30",
  urgente: "text-red-200/90 border-red-500/30",
};

export type EstrategiaFase =
  | "fundacao"
  | "trafego_pago"
  | "organico"
  | "conteudo"
  | "reputacao";

export const ESTRATEGIA_FASES: { key: EstrategiaFase; label: string }[] = [
  { key: "fundacao", label: "Fundação" },
  { key: "trafego_pago", label: "Tráfego pago" },
  { key: "organico", label: "Orgânico" },
  { key: "conteudo", label: "Conteúdo" },
  { key: "reputacao", label: "Reputação" },
];

export const RESPONSAVEIS = ["Luan", "Samuel"] as const;
