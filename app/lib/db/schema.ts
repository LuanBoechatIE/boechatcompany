// Schema do banco (Drizzle + Postgres/Neon).
// Três tabelas: presets (modelos de oferta), clientes, respostas.
import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  jsonb,
  numeric,
  boolean,
} from "drizzle-orm/pg-core";
import type { FieldDef, RespostaValores } from "@/app/lib/onboarding/types";

export const presets = pgTable("presets", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  descricao: text("descricao").notNull().default(""),
  campos: jsonb("campos").$type<FieldDef[]>().notNull().default([]),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

export const clientes = pgTable("clientes", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  contato: text("contato").notNull().default(""),
  presetId: integer("preset_id")
    .notNull()
    .references(() => presets.id, { onDelete: "restrict" }),
  token: text("token").notNull().unique(),
  // criado | respondido | reaberto
  status: text("status").notNull().default("criado"),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  respondidoEm: timestamp("respondido_em", { withTimezone: true }),
});

export const respostas = pgTable("respostas", {
  clienteId: integer("cliente_id")
    .primaryKey()
    .references(() => clientes.id, { onDelete: "cascade" }),
  valores: jsonb("valores").$type<RespostaValores>().notNull().default({}),
  enviadoEm: timestamp("enviado_em", { withTimezone: true }).notNull().defaultNow(),
});

export type Preset = typeof presets.$inferSelect;
export type Cliente = typeof clientes.$inferSelect;
export type Resposta = typeof respostas.$inferSelect;

// ───────────────────────────────────────────────────────────────────────────
// CRM / gestão interna (portado do SammaS Hub pra stack Neon/Drizzle).
// Tabelas: leads, crm_clientes, projetos, tarefas, demandas, estrategia_items,
// mapas_mentais. Rode app/lib/db/crm.sql no SQL Editor do Neon uma vez.
// ───────────────────────────────────────────────────────────────────────────

// Prospecção (pipeline comercial). status: uma das etapas em LEAD_STAGES
// (novo | primeiro_contato | qualificado | proposta | negociacao |
//  convertido | perdido).
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  email: text("email").notNull().default(""),
  whatsapp: text("whatsapp").notNull().default(""),
  empresa: text("empresa").notNull().default(""),
  setor: text("setor").notNull().default(""),
  faturamento: text("faturamento").notNull().default(""),
  status: text("status").notNull().default("novo"),
  origem: text("origem").notNull().default("manual"), // site | indicacao | meta | google | ...
  // Campos comerciais.
  pessoaContato: text("pessoa_contato").notNull().default(""),
  telefone: text("telefone").notNull().default(""),
  servico: text("servico").notNull().default(""),
  responsavel: text("responsavel").notNull().default(""),
  valorEstimado: numeric("valor_estimado", { precision: 12, scale: 2 }),
  proximaAcao: text("proxima_acao").notNull().default(""),
  proximoContato: timestamp("proximo_contato", { withTimezone: true }),
  tags: text("tags").notNull().default(""), // separadas por vírgula
  observacoes: text("observacoes").notNull().default(""),
  motivoPerda: text("motivo_perda").notNull().default(""),
  arquivado: boolean("arquivado").notNull().default(false),
  // Comando comercial (Fase 1 do Sales Command Center).
  prioridade: text("prioridade").notNull().default("media"), // baixa|media|alta|urgente
  leadScore: integer("lead_score").notNull().default(0), // 0-100, calculado por regras
  scoreFixo: integer("score_fixo"), // override manual opcional (null = automático)
  ultimaInteracaoEm: timestamp("ultima_interacao_em", { withTimezone: true }),
  proximoContatoResponsavel: text("proximo_contato_responsavel").notNull().default(""),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }),
});

// Histórico/atividades de um lead: notas, tarefas, eventos do pipeline,
// interações comerciais (ligação, whatsapp, e-mail, reunião...) e auditoria.
// tipo: ver ATIVIDADE_TIPOS em crm/types.ts. Quando tipo=auditoria, os campos
// campo/valorAnterior/valorNovo guardam o diff.
export const leadAtividades = pgTable("lead_atividades", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  tipo: text("tipo").notNull().default("nota"),
  texto: text("texto").notNull().default(""),
  data: timestamp("data", { withTimezone: true }), // prazo, quando tipo=tarefa
  feito: boolean("feito").notNull().default(false),
  autor: text("autor").notNull().default(""),
  // Auditoria (tipo=auditoria): o que mudou.
  campo: text("campo").notNull().default(""),
  valorAnterior: text("valor_anterior").notNull().default(""),
  valorNovo: text("valor_novo").notNull().default(""),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

// Checklist de um lead (itens marcáveis).
export const leadChecklist = pgTable("lead_checklist", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  texto: text("texto").notNull().default(""),
  feito: boolean("feito").notNull().default(false),
  ordem: integer("ordem").notNull().default(0),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

// Arquivos anexados a um lead (Vercel Blob).
export const leadArquivos = pgTable("lead_arquivos", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  nome: text("nome").notNull().default(""),
  url: text("url").notNull().default(""),
  tamanho: integer("tamanho").notNull().default(0), // bytes
  autor: text("autor").notNull().default(""),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

// Filtros salvos (favoritos) do pipeline. `filtro` guarda o query state.
export const leadFiltrosSalvos = pgTable("lead_filtros_salvos", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  autor: text("autor").notNull().default(""),
  filtro: jsonb("filtro").$type<Record<string, string>>().notNull().default({}),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

// Clientes de CRM (negócios ganhos). Separado do onboarding `clientes`.
export const crmClientes = pgTable("crm_clientes", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  empresa: text("empresa").notNull().default(""),
  email: text("email").notNull().default(""),
  whatsapp: text("whatsapp").notNull().default(""),
  telefone: text("telefone").notNull().default(""),
  segmento: text("segmento").notNull().default(""),
  endereco: text("endereco").notNull().default(""),
  cidade: text("cidade").notNull().default(""),
  estado: text("estado").notNull().default(""),
  site: text("site").notNull().default(""),
  instagram: text("instagram").notNull().default(""),
  responsavelInterno: text("responsavel_interno").notNull().default(""),
  statusCliente: text("status_cliente").notNull().default("ativo"), // ativo|pausado|arquivado
  observacoes: text("observacoes").notNull().default(""),
  proximosPassos: text("proximos_passos").notNull().default(""),
  logo: text("logo").notNull().default(""),
  leadId: integer("lead_id").references(() => leads.id, { onDelete: "set null" }),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

// status: planejamento | andamento | revisao | concluido
export const projetos = pgTable("projetos", {
  id: serial("id").primaryKey(),
  clienteId: integer("cliente_id").references(() => crmClientes.id, {
    onDelete: "cascade",
  }),
  nome: text("nome").notNull(),
  briefing: text("briefing").notNull().default(""),
  status: text("status").notNull().default("planejamento"),
  prazo: timestamp("prazo", { withTimezone: true }),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

// Kanban de tarefas. status: todo | doing | review | done
export const tarefas = pgTable("tarefas", {
  id: serial("id").primaryKey(),
  projetoId: integer("projeto_id")
    .notNull()
    .references(() => projetos.id, { onDelete: "cascade" }),
  titulo: text("titulo").notNull(),
  descricao: text("descricao").notNull().default(""),
  status: text("status").notNull().default("todo"),
  responsavel: text("responsavel").notNull().default(""),
  prioridade: text("prioridade").notNull().default("media"), // baixa | media | alta
  prazo: timestamp("prazo", { withTimezone: true }),
  ordem: integer("ordem").notNull().default(0),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

// Kanban geral. status: backlog | andamento | revisao | concluido
export const demandas = pgTable("demandas", {
  id: serial("id").primaryKey(),
  titulo: text("titulo").notNull(),
  descricao: text("descricao").notNull().default(""),
  status: text("status").notNull().default("backlog"),
  prioridade: text("prioridade").notNull().default("media"), // baixa|media|alta|urgente
  clienteId: integer("cliente_id").references(() => crmClientes.id, {
    onDelete: "set null",
  }),
  responsavel: text("responsavel").notNull().default(""),
  prazo: timestamp("prazo", { withTimezone: true }),
  ordem: integer("ordem").notNull().default(0),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }),
});

// Estratégia por fases. fase: fundacao|trafego_pago|organico|conteudo|reputacao
export const estrategiaItems = pgTable("estrategia_items", {
  id: serial("id").primaryKey(),
  clienteId: integer("cliente_id").references(() => crmClientes.id, {
    onDelete: "cascade",
  }),
  fase: text("fase").notNull().default("fundacao"),
  titulo: text("titulo").notNull(),
  descricao: text("descricao").notNull().default(""),
  responsavel: text("responsavel").notNull().default(""),
  status: text("status").notNull().default("todo"), // todo | doing | done
  prioridade: text("prioridade").notNull().default("media"),
  ordem: integer("ordem").notNull().default(0),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

// Mapas mentais (canvas React Flow).
export const mapasMentais = pgTable("mapas_mentais", {
  id: serial("id").primaryKey(),
  titulo: text("titulo").notNull().default("Novo mapa"),
  clienteId: integer("cliente_id").references(() => crmClientes.id, {
    onDelete: "set null",
  }),
  nodes: jsonb("nodes").$type<unknown[]>().notNull().default([]),
  edges: jsonb("edges").$type<unknown[]>().notNull().default([]),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
});

// ───────────────────────────────────────────────────────────────────────────
// Financeiro. Alimenta a dashboard executiva (/admin/crm). Rode
// app/lib/db/financeiro.sql no SQL Editor do Neon uma vez.
// ───────────────────────────────────────────────────────────────────────────

// Um contrato = um "compromisso" financeiro com um cliente. Pode ter valor de
// implementação (one-time), valor recorrente (MRR), ou os dois.
// status: ativo | pausado | encerrado
export const contratos = pgTable("contratos", {
  id: serial("id").primaryKey(),
  clienteId: integer("cliente_id")
    .notNull()
    .references(() => crmClientes.id, { onDelete: "cascade" }),
  projetoId: integer("projeto_id").references(() => projetos.id, {
    onDelete: "set null",
  }),
  servico: text("servico").notNull(),
  valorImplementacao: numeric("valor_implementacao", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  valorRecorrente: numeric("valor_recorrente", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  status: text("status").notNull().default("ativo"),
  dataInicio: timestamp("data_inicio", { withTimezone: true }).notNull().defaultNow(),
  proximaCobranca: timestamp("proxima_cobranca", { withTimezone: true }),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

// Um pagamento = um evento de caixa (recebido ou a receber) ligado a um
// contrato. tipo: implementacao | recorrente. status: pago | pendente | atrasado
export const pagamentos = pgTable("pagamentos", {
  id: serial("id").primaryKey(),
  contratoId: integer("contrato_id")
    .notNull()
    .references(() => contratos.id, { onDelete: "cascade" }),
  clienteId: integer("cliente_id")
    .notNull()
    .references(() => crmClientes.id, { onDelete: "cascade" }),
  tipo: text("tipo").notNull().default("implementacao"),
  valor: numeric("valor", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("pendente"),
  vencimento: timestamp("vencimento", { withTimezone: true }).notNull(),
  pagoEm: timestamp("pago_em", { withTimezone: true }),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

// Custo/despesa da operação. Usado só pra calcular o lucro do mês.
export const despesas = pgTable("despesas", {
  id: serial("id").primaryKey(),
  descricao: text("descricao").notNull(),
  valor: numeric("valor", { precision: 12, scale: 2 }).notNull(),
  categoria: text("categoria").notNull().default("geral"),
  data: timestamp("data", { withTimezone: true }).notNull().defaultNow(),
  recorrente: boolean("recorrente").notNull().default(false),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

export type Contrato = typeof contratos.$inferSelect;
export type Pagamento = typeof pagamentos.$inferSelect;
export type Despesa = typeof despesas.$inferSelect;

// Integrações de anúncios por cliente (Meta / Google). Segredos vão
// criptografados em `segredos`; `dados` e `mascaras` são não-sensíveis
// (exibíveis). Nunca expor `segredos` pro frontend.
export const integracoes = pgTable("integracoes", {
  id: serial("id").primaryKey(),
  clienteId: integer("cliente_id")
    .notNull()
    .references(() => crmClientes.id, { onDelete: "cascade" }),
  plataforma: text("plataforma").notNull(), // meta | google
  dados: jsonb("dados").$type<Record<string, string>>().notNull().default({}),
  segredos: text("segredos").notNull().default(""), // blob AES-256-GCM
  mascaras: jsonb("mascaras").$type<Record<string, string>>().notNull().default({}),
  status: text("status").notNull().default("desconectado"), // conectado|erro|desconectado
  ultimaSync: timestamp("ultima_sync", { withTimezone: true }),
  tokenExpiraEm: timestamp("token_expira_em", { withTimezone: true }),
  atualizadoPor: text("atualizado_por").notNull().default(""),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
});

// Auditoria: quem mexeu em qual integração e quando.
export const integracaoLogs = pgTable("integracao_logs", {
  id: serial("id").primaryKey(),
  clienteId: integer("cliente_id")
    .notNull()
    .references(() => crmClientes.id, { onDelete: "cascade" }),
  plataforma: text("plataforma").notNull(),
  acao: text("acao").notNull(), // salvou|testou|sincronizou|desconectou
  autor: text("autor").notNull().default(""),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

export type Integracao = typeof integracoes.$inferSelect;
export type IntegracaoLog = typeof integracaoLogs.$inferSelect;

export type Lead = typeof leads.$inferSelect;
export type LeadAtividade = typeof leadAtividades.$inferSelect;
export type LeadChecklistItem = typeof leadChecklist.$inferSelect;
export type LeadArquivo = typeof leadArquivos.$inferSelect;
export type LeadFiltroSalvo = typeof leadFiltrosSalvos.$inferSelect;
export type CrmCliente = typeof crmClientes.$inferSelect;
export type Projeto = typeof projetos.$inferSelect;
export type Tarefa = typeof tarefas.$inferSelect;
export type Demanda = typeof demandas.$inferSelect;
export type EstrategiaItem = typeof estrategiaItems.$inferSelect;
export type MapaMental = typeof mapasMentais.$inferSelect;

// ── Google Calendar (integração de agenda) ───────────────────────────────────

export const googleCalendarConnections = pgTable("google_calendar_connections", {
  id: serial("id").primaryKey(),
  googleAccountEmail: text("google_account_email").notNull().default(""),
  calendarId: text("calendar_id").notNull().default("primary"),
  calendarName: text("calendar_name").notNull().default(""),
  encryptedAccessToken: text("encrypted_access_token").notNull().default(""),
  encryptedRefreshToken: text("encrypted_refresh_token").notNull().default(""),
  tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
  scopes: text("scopes").notNull().default(""),
  syncToken: text("sync_token").notNull().default(""),
  status: text("status").notNull().default("conectado"), // conectado|desconectado|expirado|erro
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  connectedBy: text("connected_by").notNull().default(""),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
});

export const googleCalendarChannels = pgTable("google_calendar_channels", {
  id: serial("id").primaryKey(),
  connectionId: integer("connection_id")
    .notNull()
    .references(() => googleCalendarConnections.id, { onDelete: "cascade" }),
  channelId: text("channel_id").notNull(),
  resourceId: text("resource_id").notNull().default(""),
  encryptedVerificationToken: text("encrypted_verification_token").notNull().default(""),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  status: text("status").notNull().default("ativo"),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
});

export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull().default(""),
  description: text("description").notNull().default(""),
  type: text("type").notNull().default("evento"), // reuniao|evento|demanda|tarefa|prazo
  clienteId: integer("cliente_id").references(() => crmClientes.id, { onDelete: "set null" }),
  projetoId: integer("projeto_id").references(() => projetos.id, { onDelete: "set null" }),
  organizerUserId: text("organizer_user_id").notNull().default(""),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  allDay: boolean("all_day").notNull().default(false),
  timezone: text("timezone").notNull().default("America/Sao_Paulo"),
  location: text("location").notNull().default(""),
  meetLink: text("meet_link").notNull().default(""),
  recurrenceRule: text("recurrence_rule").notNull().default(""),
  status: text("status").notNull().default("confirmado"), // confirmado|cancelado
  source: text("source").notNull().default("boechat"), // boechat|google
  createdBy: text("created_by").notNull().default(""),
  updatedBy: text("updated_by").notNull().default(""),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
});

export const calendarEventAttendees = pgTable("calendar_event_attendees", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id")
    .notNull()
    .references(() => calendarEvents.id, { onDelete: "cascade" }),
  name: text("name").notNull().default(""),
  email: text("email").notNull(),
  optional: boolean("optional").notNull().default(false),
  responseStatus: text("response_status").notNull().default("needsAction"), // needsAction|accepted|tentative|declined
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
});

export const calendarEventIntegrations = pgTable("calendar_event_integrations", {
  id: serial("id").primaryKey(),
  calendarEventId: integer("calendar_event_id").references(() => calendarEvents.id, { onDelete: "cascade" }),
  entityType: text("entity_type").notNull().default("evento"), // evento|demanda|tarefa|projeto
  entityId: integer("entity_id"),
  connectionId: integer("connection_id")
    .notNull()
    .references(() => googleCalendarConnections.id, { onDelete: "cascade" }),
  googleEventId: text("google_event_id").notNull(),
  googleCalendarId: text("google_calendar_id").notNull().default("primary"),
  googleEtag: text("google_etag").notNull().default(""),
  googleUpdatedAt: timestamp("google_updated_at", { withTimezone: true }),
  lastSyncDirection: text("last_sync_direction").notNull().default(""), // boechat_to_google|google_to_boechat
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  status: text("status").notNull().default("ativo"), // ativo|desvinculado|cancelado
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
});

export const calendarSyncLogs = pgTable("calendar_sync_logs", {
  id: serial("id").primaryKey(),
  connectionId: integer("connection_id").references(() => googleCalendarConnections.id, { onDelete: "cascade" }),
  direction: text("direction").notNull().default(""),
  action: text("action").notNull().default(""),
  status: text("status").notNull().default(""),
  message: text("message").notNull().default(""),
  googleEventId: text("google_event_id").notNull().default(""),
  internalEventId: integer("internal_event_id"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
});

export type GoogleCalendarConnection = typeof googleCalendarConnections.$inferSelect;
export type GoogleCalendarChannel = typeof googleCalendarChannels.$inferSelect;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type CalendarEventAttendee = typeof calendarEventAttendees.$inferSelect;
export type CalendarEventIntegration = typeof calendarEventIntegrations.$inferSelect;
export type CalendarSyncLog = typeof calendarSyncLogs.$inferSelect;

// ── Usuários (perfil + credenciais opcionais em banco) ───────────────────────
// A autenticação continua vindo de CONTRATOS_USERS (env). Esta tabela guarda o
// PERFIL (nome, foto, cargos, preferências) e, opcionalmente, um hash de senha
// que, quando presente, tem prioridade sobre a env (com fallback seguro).
export const usuarios = pgTable("usuarios", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  nomeCompleto: text("nome_completo").notNull().default(""),
  email: text("email").notNull().default(""),
  foto: text("foto").notNull().default(""),
  cargos: jsonb("cargos").notNull().default([]),
  preferencias: jsonb("preferencias").notNull().default({}),
  senhaHash: text("senha_hash").notNull().default(""),
  trocaSenhaObrigatoria: boolean("troca_senha_obrigatoria").notNull().default(false),
  status: text("status").notNull().default("ativo"), // ativo|bloqueado
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  ultimoAcesso: timestamp("ultimo_acesso", { withTimezone: true }),
});

export type Usuario = typeof usuarios.$inferSelect;

// ── Cargos (profissional) + Roles/Permissões (acesso) ────────────────────────
// Cargo = função profissional (Designer, Gestor de Tráfego...). Role/permissão
// = acesso real no sistema. São coisas SEPARADAS de propósito.
export const cargos = pgTable("cargos", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull().unique(),
  cor: text("cor").notNull().default("#a78bfa"),
  ativo: boolean("ativo").notNull().default(true),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

export const userCargos = pgTable("user_cargos", {
  id: serial("id").primaryKey(),
  usuarioId: integer("usuario_id").notNull().references(() => usuarios.id, { onDelete: "cascade" }),
  cargoId: integer("cargo_id").notNull().references(() => cargos.id, { onDelete: "cascade" }),
});

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  chave: text("chave").notNull().unique(),
  nome: text("nome").notNull().default(""),
  descricao: text("descricao").notNull().default(""),
  sup: boolean("sup").notNull().default(false), // super_admin => todas as permissões
  ativo: boolean("ativo").notNull().default(true),
});

export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  chave: text("chave").notNull().unique(), // ex.: "financeiro.visualizar"
  modulo: text("modulo").notNull().default(""),
  acao: text("acao").notNull().default(""),
  label: text("label").notNull().default(""),
});

export const rolePermissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  roleId: integer("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  permissionId: integer("permission_id").notNull().references(() => permissions.id, { onDelete: "cascade" }),
});

export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  usuarioId: integer("usuario_id").notNull().references(() => usuarios.id, { onDelete: "cascade" }),
  roleId: integer("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
});

export const userPermissionOverrides = pgTable("user_permission_overrides", {
  id: serial("id").primaryKey(),
  usuarioId: integer("usuario_id").notNull().references(() => usuarios.id, { onDelete: "cascade" }),
  permissionId: integer("permission_id").notNull().references(() => permissions.id, { onDelete: "cascade" }),
  permitido: boolean("permitido").notNull().default(true), // grant (true) ou deny (false)
});

export type Cargo = typeof cargos.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type Permission = typeof permissions.$inferSelect;
