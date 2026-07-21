// Tipos compartilhados do onboarding (usados no schema, admin e form do cliente).

export type FieldType =
  | "texto" // linha única
  | "textarea" // texto longo
  | "select" // escolha uma opção
  | "sim_nao" // booleano
  | "numero"
  | "data"
  | "arquivo" // upload real (Vercel Blob); 1+ arquivos, valor = URLs separadas por \n
  | "link"; // URL colada à mão (Drive/WeTransfer)

export interface FieldDef {
  id: string; // estável, gerado ao criar o campo
  label: string; // a pergunta que o cliente vê
  tipo: FieldType;
  obrigatorio: boolean;
  opcoes?: string[]; // só pra tipo "select"
  ajuda?: string; // texto de apoio opcional abaixo do label
}

// Respostas do cliente: id do campo -> valor (string sempre; sim_nao vira "sim"/"nao").
export type RespostaValores = Record<string, string>;

export const TIPOS_LABEL: Record<FieldType, string> = {
  texto: "Texto curto",
  textarea: "Texto longo",
  select: "Escolha (lista)",
  sim_nao: "Sim / Não",
  numero: "Número",
  data: "Data",
  arquivo: "Arquivo (upload)",
  link: "Link colado (Drive/WeTransfer)",
};

export type ClienteStatus = "criado" | "respondido" | "reaberto";

export const STATUS_LABEL: Record<ClienteStatus, string> = {
  criado: "Aguardando resposta",
  respondido: "Respondido",
  reaberto: "Reaberto pra edição",
};
