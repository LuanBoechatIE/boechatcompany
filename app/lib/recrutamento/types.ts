// Tipos do módulo de Recrutamento (Equipe → Recrutamento). Independente do
// onboarding de clientes — reaproveita FieldDef/RespostaValores (mesma tabela
// `presets`, filtrada por escopo="recrutamento"), mas tem semântica própria.
export { type FieldDef, type RespostaValores, TIPOS_LABEL } from "@/app/lib/onboarding/types";

export type VagaModelo = "presencial" | "hibrido" | "remoto";

export const MODELO_LABEL: Record<VagaModelo, string> = {
  presencial: "Presencial",
  hibrido: "Híbrido",
  remoto: "Remoto",
};

export type VagaStatus = "rascunho" | "aberta" | "fechada";

export const VAGA_STATUS_LABEL: Record<VagaStatus, string> = {
  rascunho: "Rascunho",
  aberta: "Aberta",
  fechada: "Fechada",
};

export type CandidaturaStatus = "recebida" | "contratado" | "rejeitada";

export const CANDIDATURA_STATUS_LABEL: Record<CandidaturaStatus, string> = {
  recebida: "Recebida",
  contratado: "Contratado",
  rejeitada: "Rejeitada",
};

// DTOs pra UI (mesmo padrão do LeadDTO — camada de dados enriquece o row bruto).
export type VagaDTO = {
  id: number;
  nome: string;
  descricao: string;
  cargoId: number | null;
  cargoNome: string;
  departamento: string;
  modelo: VagaModelo;
  cidade: string;
  status: VagaStatus;
  presetId: number | null;
  token: string;
  totalCandidaturas: number;
  criadoEmLabel: string;
};

export type CandidaturaDTO = {
  id: number;
  vagaId: number;
  vagaNome: string;
  nome: string;
  email: string;
  telefone: string;
  status: CandidaturaStatus;
  usuarioId: number | null;
  criadoEmLabel: string;
  criadoEmMs: number;
  // Campos "soft" pra exibição no card — lidos de valores por convenção de
  // label (não são coluna dedicada, então degradam pra "—" sem quebrar nada).
  cidade: string;
  experiencia: string;
  foto: string;
};
