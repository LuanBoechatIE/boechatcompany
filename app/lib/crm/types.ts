// Tipos, status e labels do CRM/gestão interna.

// Pipeline comercial. Estruturado como array (ordenado) pra que no futuro as
// etapas possam ser editadas/removidas/reordenadas sem espalhar strings.
export type LeadStatus =
  | "novo"
  | "primeiro_contato"
  | "qualificado"
  | "proposta"
  | "negociacao"
  | "convertido"
  | "perdido";

export type LeadStage = {
  key: LeadStatus;
  label: string;
  dot: string;
  accent: string;
};

export const LEAD_STAGES: LeadStage[] = [
  { key: "novo", label: "Novo", dot: "bg-sky-400", accent: "bg-sky-400" },
  { key: "primeiro_contato", label: "Primeiro contato", dot: "bg-cyan-400", accent: "bg-cyan-400" },
  { key: "qualificado", label: "Qualificado", dot: "bg-violet-400", accent: "bg-violet-400" },
  { key: "proposta", label: "Proposta enviada", dot: "bg-indigo-400", accent: "bg-indigo-400" },
  { key: "negociacao", label: "Negociação", dot: "bg-yellow-400", accent: "bg-yellow-400" },
  { key: "convertido", label: "Convertido", dot: "bg-emerald-400", accent: "bg-emerald-400" },
  { key: "perdido", label: "Perdido", dot: "bg-red-400", accent: "bg-red-400" },
];

// Compat: mantém LEAD_STATUS como alias do novo pipeline.
export const LEAD_STATUS = LEAD_STAGES;

export const LEAD_STATUS_LABEL: Record<string, string> = Object.fromEntries(
  LEAD_STAGES.map((s) => [s.key, s.label]),
);

export const ORIGENS_LEAD = [
  "Site",
  "Indicação",
  "Meta Ads",
  "Google Ads",
  "Instagram",
  "WhatsApp",
  "Prospecção",
  "Outro",
] as const;

export const SERVICOS = [
  "Site",
  "Tráfego pago",
  "Social media",
  "Identidade visual",
  "Sistema",
  "Consultoria",
  "Outro",
] as const;

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

// DTOs serializáveis passados pro Kanban de leads (client).
export type LeadDTO = {
  id: number;
  nome: string;
  empresa: string;
  pessoaContato: string;
  telefone: string;
  email: string;
  whatsapp: string;
  servico: string;
  responsavel: string;
  origem: string;
  valorEstimado: string | null;
  proximaAcao: string;
  tags: string;
  observacoes: string;
  status: LeadStatus;
  motivoPerda: string;
  criadoEmLabel: string;
  proximoContatoLabel: string | null;
  proximoContatoInput: string; // yyyy-mm-dd pro input date
  atrasado: boolean;
};

export type AtividadeDTO = {
  id: number;
  tipo: string; // nota | tarefa | evento
  texto: string;
  dataLabel: string | null;
  feito: boolean;
  autor: string;
  criadoEmLabel: string;
};

export function tagsArray(tags: string): string[] {
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
