// Schema do módulo de Conteúdo (/conteudo). Prefixo `cont_` em todas as tabelas
// pra não colidir com nada do admin/CRM. Reexportado por schema.ts — o Drizzle
// continua com UMA instância só, o módulo é que fica isolado neste arquivo.
//
// Modelo inteiro definido de uma vez (não por etapa) de propósito: migração de
// schema em Postgres é mais cara que tabela vazia esperando ser usada.
import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  jsonb,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ───────────────────────────────────────────────────────────────────────────
// Domínio (constantes compartilhadas com a UI e com os prompts)
// ───────────────────────────────────────────────────────────────────────────

/** Pilares de `06-presenca/instagram.md`, com o peso alvo no calendário. */
export const PILARES = {
  verdade_dura: { rotulo: "Verdade dura", peso: 0.4 },
  prova: { rotulo: "Prova / bastidor", peso: 0.25 },
  metodo: { rotulo: "Método", peso: 0.15 },
  voce: { rotulo: "Você", peso: 0.1 },
  oferta: { rotulo: "Oferta / CTA", peso: 0.1 },
} as const;

export type Pilar = keyof typeof PILARES;
export const PILAR_IDS = Object.keys(PILARES) as Pilar[];

/** Formatos que a plataforma sabe produzir. `reel` é o padrão da casa. */
export const FORMATOS = ["reel", "carrossel", "estatico", "stories"] as const;
export type Formato = (typeof FORMATOS)[number];

export const STATUS_POST = [
  "rascunho",
  "aprovado",
  "agendado",
  "publicado",
  "erro",
  "arquivado",
] as const;
export type StatusPost = (typeof STATUS_POST)[number];

/** Só Instagram por ora (decisão 2026-07-26). O resto entra por adapter. */
export const PLATAFORMAS = ["instagram", "linkedin", "threads", "x"] as const;
export type Plataforma = (typeof PLATAFORMAS)[number];

// ───────────────────────────────────────────────────────────────────────────
// Tipos ricos guardados em jsonb
// ───────────────────────────────────────────────────────────────────────────

/** Roteiro de Reel: o entregável primário. */
export type Roteiro = {
  gancho: string; // os 3 primeiros segundos
  blocos: { fala: string; textoNaTela?: string; direcao?: string }[];
  fechamento: string;
  duracaoEstimadaSegundos: number;
};

/** Slide de carrossel. `roteiro` fica nulo quando o formato é carrossel. */
export type Slide = { titulo: string; corpo: string; papel?: string };

export type ParametrosImagem = {
  estilo?: string;
  paleta?: string[];
  tipografia?: string;
  composicao?: string;
  iluminacao?: string;
  proporcao?: string;
};

/** Uma linha do ledger: o que a IA lê pra não repetir assunto. */
export type LedgerItem = {
  data: string;
  pilar: Pilar;
  tema: string;
  gancho: string;
};

// ───────────────────────────────────────────────────────────────────────────
// Espelho do Vault (fonte da verdade continua sendo o Obsidian + git)
// ───────────────────────────────────────────────────────────────────────────

// Uma linha por arquivo .md do repo boechat-vault. `sha` é o blob SHA do
// GitHub: se não mudou, o sync nem baixa o conteúdo.
export const contVaultDocs = pgTable(
  "cont_vault_docs",
  {
    path: text("path").primaryKey(), // ex.: maquina-de-caixa/01-oferta/dark-kitchen.md
    sha: text("sha").notNull(),
    titulo: text("titulo").notNull().default(""),
    conteudo: text("conteudo").notNull().default(""),
    bytes: integer("bytes").notNull().default(0),
    sincronizadoEm: timestamp("sincronizado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("cont_vault_docs_sha_idx").on(t.sha)],
);

// ───────────────────────────────────────────────────────────────────────────
// Produtos + Brief compilado (o "cérebro" que substitui RAG)
// ───────────────────────────────────────────────────────────────────────────

// Um produto = um recorte do vault. `vaultGlobs` diz quais arquivos alimentam
// o brief; `briefMd` é o resultado destilado (~8k tokens) que vai cacheado no
// prompt. `briefFonteHash` guarda o hash dos SHAs de origem: se bater, o brief
// está atualizado e não precisa recompilar.
export const contProdutos = pgTable(
  "cont_produtos",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    nome: text("nome").notNull(),
    descricao: text("descricao").notNull().default(""),
    // Marca = o guarda-chuva (pilares, tom, promessa-mãe). Sempre carregado
    // como camada L0; nunca aparece como opção de "produto" na UI.
    ehMarca: boolean("eh_marca").notNull().default(false),
    ativo: boolean("ativo").notNull().default(true),
    ordem: integer("ordem").notNull().default(0),
    vaultGlobs: jsonb("vault_globs").$type<string[]>().notNull().default([]),
    briefMd: text("brief_md").notNull().default(""),
    briefFonteHash: text("brief_fonte_hash").notNull().default(""),
    briefTokens: integer("brief_tokens").notNull().default(0),
    briefModelo: text("brief_modelo").notNull().default(""),
    briefGeradoEm: timestamp("brief_gerado_em", { withTimezone: true }),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("cont_produtos_ativo_idx").on(t.ativo, t.ordem)],
);

// ───────────────────────────────────────────────────────────────────────────
// Pautas (fase A) e Posts (fase B)
// ───────────────────────────────────────────────────────────────────────────

// A IA devolve 3 pautas por rodada; o usuário escolhe 1. Guardar as
// descartadas é de graça e alimenta o ledger anti-repetição.
export const contPautas = pgTable(
  "cont_pautas",
  {
    id: serial("id").primaryKey(),
    // Nulo = pauta de marca pura (o caso padrão). Preenchido quando o usuário
    // força um produto como assunto.
    produtoId: integer("produto_id").references(() => contProdutos.id, {
      onDelete: "set null",
    }),
    pilar: text("pilar").$type<Pilar>().notNull(),
    tema: text("tema").notNull(),
    angulo: text("angulo").notNull().default(""),
    objetivo: text("objetivo").notNull().default(""),
    emocao: text("emocao").notNull().default(""),
    gancho: text("gancho").notNull().default(""),
    formato: text("formato").$type<Formato>().notNull().default("reel"),
    justificativa: text("justificativa").notNull().default(""),
    // sugerida | escolhida | descartada
    status: text("status").notNull().default("sugerida"),
    // ia | manual
    origem: text("origem").notNull().default("ia"),
    loteId: text("lote_id").notNull().default(""), // agrupa as 3 da mesma rodada
    geradoEm: timestamp("gerado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
    escolhidoEm: timestamp("escolhido_em", { withTimezone: true }),
  },
  (t) => [
    index("cont_pautas_status_idx").on(t.status, t.geradoEm),
    index("cont_pautas_lote_idx").on(t.loteId),
  ],
);

export const contPosts = pgTable(
  "cont_posts",
  {
    id: serial("id").primaryKey(),
    pautaId: integer("pauta_id").references(() => contPautas.id, {
      onDelete: "set null",
    }),
    produtoId: integer("produto_id").references(() => contProdutos.id, {
      onDelete: "set null",
    }),
    pilar: text("pilar").$type<Pilar>().notNull(),
    formato: text("formato").$type<Formato>().notNull().default("reel"),
    status: text("status").$type<StatusPost>().notNull().default("rascunho"),
    titulo: text("titulo").notNull().default(""),
    tema: text("tema").notNull().default(""),
    roteiro: jsonb("roteiro").$type<Roteiro | null>(),
    slides: jsonb("slides").$type<Slide[]>().notNull().default([]),
    legenda: text("legenda").notNull().default(""),
    hashtags: jsonb("hashtags").$type<string[]>().notNull().default([]),
    cta: text("cta").notNull().default(""),
    // Observabilidade de custo, por post. Sem isso não dá pra saber se o
    // caching está valendo a pena.
    modelo: text("modelo").notNull().default(""),
    tokensEntrada: integer("tokens_entrada").notNull().default(0),
    tokensSaida: integer("tokens_saida").notNull().default(0),
    tokensCacheLidos: integer("tokens_cache_lidos").notNull().default(0),
    agendadoPara: timestamp("agendado_para", { withTimezone: true }),
    publicadoEm: timestamp("publicado_em", { withTimezone: true }),
    criadoPor: text("criado_por").notNull().default(""),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("cont_posts_status_idx").on(t.status, t.criadoEm),
    index("cont_posts_agenda_idx").on(t.agendadoPara),
  ],
);

// ───────────────────────────────────────────────────────────────────────────
// Biblioteca de imagens + prompts
// ───────────────────────────────────────────────────────────────────────────

// tipo `uso` = imagem que vai no post. tipo `referencia` = print/mockup que
// serve só de inspiração de estilo pra IA descrever, NUNCA pra copiar.
export const contAssets = pgTable(
  "cont_assets",
  {
    id: serial("id").primaryKey(),
    blobUrl: text("blob_url").notNull(),
    blobPathname: text("blob_pathname").notNull().default(""),
    tipo: text("tipo").notNull().default("uso"), // uso | referencia
    mime: text("mime").notNull().default(""),
    largura: integer("largura").notNull().default(0),
    altura: integer("altura").notNull().default(0),
    bytes: integer("bytes").notNull().default(0),
    titulo: text("titulo").notNull().default(""),
    // Descrição gerada por Haiku no upload: é o que torna o asset "buscável"
    // pela IA sem reenviar a imagem em toda geração.
    descricaoIa: text("descricao_ia").notNull().default(""),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    enviadoPor: text("enviado_por").notNull().default(""),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("cont_assets_tipo_idx").on(t.tipo, t.criadoEm)],
);

export const contPostAssets = pgTable(
  "cont_post_assets",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => contPosts.id, { onDelete: "cascade" }),
    assetId: integer("asset_id")
      .notNull()
      .references(() => contAssets.id, { onDelete: "cascade" }),
    ordem: integer("ordem").notNull().default(0),
    papel: text("papel").notNull().default("principal"), // principal | slide | referencia
  },
  (t) => [uniqueIndex("cont_post_assets_unq").on(t.postId, t.assetId, t.papel)],
);

export const contImagePrompts = pgTable(
  "cont_image_prompts",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => contPosts.id, { onDelete: "cascade" }),
    slideIdx: integer("slide_idx").notNull().default(0),
    objetivo: text("objetivo").notNull().default(""),
    prompt: text("prompt").notNull(),
    negativePrompt: text("negative_prompt").notNull().default(""),
    parametros: jsonb("parametros").$type<ParametrosImagem>().notNull().default({}),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("cont_image_prompts_post_idx").on(t.postId, t.slideIdx)],
);

// ───────────────────────────────────────────────────────────────────────────
// Publicação (etapa 5) — tabelas já existem pra o histórico funcionar desde a v1
// ───────────────────────────────────────────────────────────────────────────

export const contContas = pgTable(
  "cont_contas",
  {
    id: serial("id").primaryKey(),
    plataforma: text("plataforma").$type<Plataforma>().notNull(),
    handle: text("handle").notNull().default(""),
    ativo: boolean("ativo").notNull().default(true),
    // Tokens de OAuth. Nunca sai daqui pro cliente.
    credenciais: jsonb("credenciais").$type<Record<string, string>>().notNull().default({}),
    expiraEm: timestamp("expira_em", { withTimezone: true }),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("cont_contas_unq").on(t.plataforma, t.handle)],
);

// Uma linha por tentativa de entrega, por plataforma. O publisher "manual"
// (v1) também grava aqui, então o histórico é o mesmo desde o dia 1.
export const contPublicacoes = pgTable(
  "cont_publicacoes",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => contPosts.id, { onDelete: "cascade" }),
    plataforma: text("plataforma").$type<Plataforma>().notNull(),
    // pendente | publicado | erro
    status: text("status").notNull().default("pendente"),
    externalId: text("external_id").notNull().default(""),
    permalink: text("permalink").notNull().default(""),
    erro: text("erro").notNull().default(""),
    tentativas: integer("tentativas").notNull().default(0),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    publicadoEm: timestamp("publicado_em", { withTimezone: true }),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("cont_publicacoes_post_idx").on(t.postId)],
);

// ───────────────────────────────────────────────────────────────────────────
// Fila de jobs (Vercel Cron faz o poll). Nada de Redis nesse volume.
// ───────────────────────────────────────────────────────────────────────────

export const CONT_JOB_TIPOS = [
  "sync_vault",
  "compilar_brief",
  "descrever_asset",
  "publicar",
] as const;
export type ContJobTipo = (typeof CONT_JOB_TIPOS)[number];

export const contJobs = pgTable(
  "cont_jobs",
  {
    id: serial("id").primaryKey(),
    tipo: text("tipo").$type<ContJobTipo>().notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    // pendente | rodando | concluido | erro
    status: text("status").notNull().default("pendente"),
    tentativas: integer("tentativas").notNull().default(0),
    rodarApos: timestamp("rodar_apos", { withTimezone: true })
      .notNull()
      .defaultNow(),
    erro: text("erro").notNull().default(""),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
    concluidoEm: timestamp("concluido_em", { withTimezone: true }),
  },
  (t) => [index("cont_jobs_fila_idx").on(t.status, t.rodarApos)],
);

export type ContVaultDoc = typeof contVaultDocs.$inferSelect;
export type ContProduto = typeof contProdutos.$inferSelect;
export type ContPauta = typeof contPautas.$inferSelect;
export type ContPost = typeof contPosts.$inferSelect;
export type ContAsset = typeof contAssets.$inferSelect;
export type ContPublicacao = typeof contPublicacoes.$inferSelect;
export type ContJob = typeof contJobs.$inferSelect;
