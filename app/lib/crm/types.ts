// Tipos, status e labels do CRM/gestão interna.
import type { Temperatura } from "./lead-score";

// Pipeline comercial. Estruturado como array (ordenado) pra que no futuro as
// etapas possam ser editadas/removidas/reordenadas sem espalhar strings.
export type LeadStatus =
  | "novo"
  | "primeiro_contato"
  | "qualificado"
  | "reuniao_agendada"
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

// Pipeline orientado à cadência de prospecção (Sales OS). O motor move os leads
// entre etapas automaticamente; o Kanban só reflete o estado.
export const LEAD_STAGES: LeadStage[] = [
  { key: "novo", label: "Novo", dot: "bg-sky-400", accent: "bg-sky-400" },
  { key: "primeiro_contato", label: "Em contato", dot: "bg-cyan-400", accent: "bg-cyan-400" },
  { key: "qualificado", label: "Qualificado", dot: "bg-violet-400", accent: "bg-violet-400" },
  { key: "reuniao_agendada", label: "Reunião agendada", dot: "bg-fuchsia-400", accent: "bg-fuchsia-400" },
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

// Prioridade comercial do lead (reusa o tipo Prioridade).
export const LEAD_PRIORIDADES: { key: Prioridade; label: string; dot: string }[] = [
  { key: "baixa", label: "Baixa", dot: "bg-gelo-dim" },
  { key: "media", label: "Média", dot: "bg-sky-400" },
  { key: "alta", label: "Alta", dot: "bg-yellow-400" },
  { key: "urgente", label: "Urgente", dot: "bg-red-400" },
];

export const LEAD_PRIORIDADE_LABEL: Record<string, string> = Object.fromEntries(
  LEAD_PRIORIDADES.map((p) => [p.key, p.label]),
);

// Tipos de atividade/timeline do lead. `interacao` marca os que contam como
// contato real com o lead (alimentam nº de interações, última interação e score).
export type AtividadeTipo = {
  key: string;
  label: string;
  interacao: boolean;
  icon: string; // nome lógico, mapeado pro ícone no client
};

export const ATIVIDADE_TIPOS: AtividadeTipo[] = [
  { key: "nota", label: "Nota", interacao: false, icon: "nota" },
  { key: "tarefa", label: "Tarefa", interacao: false, icon: "tarefa" },
  { key: "ligacao", label: "Ligação", interacao: true, icon: "ligacao" },
  { key: "whatsapp", label: "WhatsApp", interacao: true, icon: "whatsapp" },
  { key: "email", label: "E-mail", interacao: true, icon: "email" },
  { key: "reuniao", label: "Reunião", interacao: true, icon: "reuniao" },
  { key: "mensagem", label: "Mensagem", interacao: true, icon: "mensagem" },
  { key: "visita", label: "Visita", interacao: true, icon: "visita" },
  { key: "proposta", label: "Proposta enviada", interacao: true, icon: "proposta" },
  { key: "evento", label: "Evento", interacao: false, icon: "evento" },
  { key: "auditoria", label: "Alteração", interacao: false, icon: "auditoria" },
  { key: "outro", label: "Outro", interacao: true, icon: "outro" },
];

const ATIVIDADE_INTERACAO = new Set(
  ATIVIDADE_TIPOS.filter((t) => t.interacao).map((t) => t.key),
);

export function isInteracao(tipo: string): boolean {
  return ATIVIDADE_INTERACAO.has(tipo);
}

// ── Motor de cadência (Sales OS) ─────────────────────────────────────────────
// Tipo da próxima ação que o sistema recomenda executar.
export type AcaoTipo = "ligar" | "whatsapp" | "reuniao" | "aguardar" | "nenhuma";

export const ACAO_LABEL: Record<AcaoTipo, string> = {
  ligar: "Ligar",
  whatsapp: "Enviar WhatsApp",
  reuniao: "Reunião",
  aguardar: "Aguardar",
  nenhuma: "Sem ação",
};

// Motivos que ENCERRAM definitivamente um lead (os únicos).
export const MOTIVOS_ENCERRAMENTO = [
  { key: "numero_invalido", label: "Número inválido" },
  { key: "empresa_fechou", label: "Empresa fechou" },
] as const;

// Próxima ação recomendada, computada pelo motor.
export type ProximaAcaoRec = {
  tipo: AcaoTipo;
  label: string;
  quandoLabel: string; // "agora", "hoje 16:00", "amanhã 09:00"...
  atrasada: boolean;
};

// Payload de um atendimento (o que o modal coleta na árvore de decisão).
export type ResultadoAtendimento = {
  leadId: number;
  canal: "ligacao" | "whatsapp";
  atendeu?: boolean;
  decisor?: boolean;
  interesse?: boolean;
  reuniaoMarcada?: boolean;
  motivo?: string;
  encerrar?: "numero_invalido" | "empresa_fechou" | null;
  proximaAcao?: "ligar" | "whatsapp" | "outro_horario" | "followup";
  reuniao?: { dataHora: string; tipo: "online" | "presencial" };
  gatekeeper?: { nome: string; cargo: string; telefone: string; horario: string };
  observacao?: string;
  agendarPara?: string; // ISO datetime — override manual do horário sugerido
};

// Estado do follow-up (próximo contato) de um lead.
export type FollowUpStatus = "atrasado" | "hoje" | "futuro" | "nenhum";

// Bandeiras visuais do card (indicadores rápidos de estado).
export type LeadFlag =
  | "recente" // interação nos últimos ~2 dias
  | "atencao" // sem interação há vários dias
  | "atrasado" // follow-up vencido
  | "hoje" // follow-up hoje
  | "quente" // score alto
  | "prioridade" // prioridade alta/urgente
  | "potencial"; // alto valor estimado

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
  // Comando comercial (Fase 1).
  prioridade: Prioridade;
  leadScore: number;
  scoreFixo: number | null;
  temperatura: Temperatura;
  numInteracoes: number;
  numAtividades: number;
  proximoContatoResponsavel: string;
  followUpStatus: FollowUpStatus;
  flags: LeadFlag[];
  // Motor de cadência (Sales OS).
  cadenciaPasso: number;
  tentativas: number; // ligações + whatsapps registrados
  tentativasLigacao: number;
  encerrado: boolean;
  motivoEncerramento: string;
  proximaAcaoRec: ProximaAcaoRec;
  proximoContatoHoraLabel: string | null; // "16:00"
  // Datas / tempos.
  criadoEmLabel: string;
  criadoEmMs: number;
  atualizadoEmLabel: string | null;
  atualizadoEmMs: number | null;
  ultimaInteracaoLabel: string | null;
  ultimaInteracaoMs: number | null;
  diasSemInteracao: number | null;
  diasDesdeCriacao: number;
  diasParado: number; // desde a última movimentação/atividade
  proximoContatoLabel: string | null;
  proximoContatoInput: string; // yyyy-mm-dd pro input date
  proximoContatoMs: number | null;
  atrasado: boolean;
};

export type AtividadeDTO = {
  id: number;
  tipo: string; // ver ATIVIDADE_TIPOS
  texto: string;
  dataLabel: string | null;
  feito: boolean;
  autor: string;
  campo: string;
  valorAnterior: string;
  valorNovo: string;
  resultado: string;
  canal: string;
  criadoEmLabel: string;
  criadoEmMs: number;
  interacao: boolean;
};

export type ChecklistDTO = {
  id: number;
  texto: string;
  feito: boolean;
  ordem: number;
};

export type ArquivoDTO = {
  id: number;
  nome: string;
  url: string;
  tamanhoLabel: string;
  autor: string;
  criadoEmLabel: string;
};

export type FiltroSalvoDTO = {
  id: number;
  nome: string;
  autor: string;
  filtro: Record<string, string>;
};

export function tagsArray(tags: string): string[] {
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ── Importação de contatos ───────────────────────────────────────────────────

// Campos do sistema que podem receber colunas do arquivo importado.
export const CAMPOS_IMPORT = [
  { key: "nome", label: "Nome", obrigatorio: true },
  { key: "empresa", label: "Empresa", obrigatorio: false },
  { key: "pessoaContato", label: "Pessoa de contato", obrigatorio: false },
  { key: "telefone", label: "Telefone", obrigatorio: false },
  { key: "whatsapp", label: "WhatsApp", obrigatorio: false },
  { key: "email", label: "E-mail", obrigatorio: false },
  { key: "servico", label: "Serviço de interesse", obrigatorio: false },
  { key: "origem", label: "Origem", obrigatorio: false },
  { key: "responsavel", label: "Responsável", obrigatorio: false },
  { key: "valorEstimado", label: "Valor estimado", obrigatorio: false },
  { key: "tags", label: "Tags", obrigatorio: false },
  { key: "observacoes", label: "Observações", obrigatorio: false },
] as const;

export type CampoImportKey = (typeof CAMPOS_IMPORT)[number]["key"];

export type LeadImportRow = Partial<Record<CampoImportKey, string>>;

export type EstrategiaDuplicado = "ignorar" | "atualizar" | "importar";

export type DuplicadoInfo = {
  index: number;
  leadId: number;
  nome: string;
  motivo: string; // "e-mail" | "telefone" | "nome + empresa"
};

export type ImportResumo = {
  importados: number;
  atualizados: number;
  ignorados: number;
  erros: number;
};

// ── Integrações (metadados dos campos, sem segredos) ─────────────────────────

export type CampoIntegracao = { key: string; label: string; req?: boolean };

export const META_CAMPOS: { dados: CampoIntegracao[]; segredos: CampoIntegracao[] } = {
  dados: [
    { key: "adAccountId", label: "ID da conta de anúncios", req: true },
    { key: "businessId", label: "Business Manager ID" },
    { key: "pixelId", label: "Pixel ID" },
    { key: "page", label: "Página do Facebook" },
    { key: "instagram", label: "Conta do Instagram" },
  ],
  segredos: [{ key: "accessToken", label: "Access Token" }],
};

export const GOOGLE_CAMPOS: { dados: CampoIntegracao[]; segredos: CampoIntegracao[] } = {
  dados: [
    { key: "customerId", label: "Customer ID", req: true },
    { key: "managerId", label: "Manager Account ID" },
    { key: "contaSelecionada", label: "Conta selecionada" },
  ],
  segredos: [
    { key: "developerToken", label: "Developer Token" },
    { key: "clientId", label: "Client ID" },
    { key: "clientSecret", label: "Client Secret" },
    { key: "refreshToken", label: "Refresh Token" },
  ],
};

export type IntegracaoView = {
  plataforma: "meta" | "google";
  dados: Record<string, string>;
  mascaras: Record<string, string>;
  status: string; // conectado | erro | desconectado
  ultimaSyncLabel: string | null;
  tokenExpiraLabel: string | null;
  atualizadoPor: string;
  atualizadoEmLabel: string | null;
  logs: { acao: string; autor: string; quando: string }[];
};
