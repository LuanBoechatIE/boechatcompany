-- Plataforma de Conteúdo (/conteudo). Módulo independente do admin: só
-- compartilha auth, banco e Blob. Todas as tabelas usam prefixo `cont_`.
-- Não depende de nenhum outro .sql deste diretório.
-- Idempotente — pode rodar de novo sem quebrar.

-- ── Espelho do vault ──────────────────────────────────────────────────────
-- Cópia de leitura do repo boechat-vault. A fonte da verdade continua sendo
-- o Obsidian + git; nada aqui é editado pela plataforma.
create table if not exists cont_vault_docs (
  path            text primary key,          -- maquina-de-caixa/01-oferta/x.md
  sha             text not null,             -- blob SHA do GitHub
  titulo          text not null default '',
  conteudo        text not null default '',
  bytes           integer not null default 0,
  sincronizado_em timestamptz not null default now()
);
create index if not exists cont_vault_docs_sha_idx on cont_vault_docs (sha);

-- ── Produtos + brief compilado ────────────────────────────────────────────
-- vault_globs diz quais arquivos alimentam o brief. brief_fonte_hash guarda o
-- hash dos SHAs de origem: se bater, o brief está atualizado.
-- eh_marca = camada base (pilares, tom, proibições), carregada em toda geração.
create table if not exists cont_produtos (
  id               serial primary key,
  slug             text not null unique,
  nome             text not null,
  descricao        text not null default '',
  eh_marca         boolean not null default false,
  ativo            boolean not null default true,
  ordem            integer not null default 0,
  vault_globs      jsonb not null default '[]'::jsonb,
  brief_md         text not null default '',
  brief_fonte_hash text not null default '',
  brief_tokens     integer not null default 0,
  brief_modelo     text not null default '',
  brief_gerado_em  timestamptz,
  criado_em        timestamptz not null default now()
);
create index if not exists cont_produtos_ativo_idx on cont_produtos (ativo, ordem);

-- ── Pautas (fase A) ───────────────────────────────────────────────────────
-- A IA devolve 3 por rodada (mesmo lote_id); o usuário escolhe 1. Guardar as
-- descartadas alimenta o histórico anti-repetição.
create table if not exists cont_pautas (
  id            serial primary key,
  produto_id    integer references cont_produtos(id) on delete set null,
  pilar         text not null,                -- verdade_dura|prova|metodo|voce|oferta
  tema          text not null,
  angulo        text not null default '',
  objetivo      text not null default '',
  emocao        text not null default '',
  gancho        text not null default '',
  formato       text not null default 'reel', -- reel|carrossel|estatico|stories
  justificativa text not null default '',
  status        text not null default 'sugerida', -- sugerida|escolhida|descartada
  origem        text not null default 'ia',       -- ia|manual
  lote_id       text not null default '',
  gerado_em     timestamptz not null default now(),
  escolhido_em  timestamptz
);
create index if not exists cont_pautas_status_idx on cont_pautas (status, gerado_em);
create index if not exists cont_pautas_lote_idx on cont_pautas (lote_id);

-- ── Posts (fase B) ────────────────────────────────────────────────────────
-- roteiro = entregável de Reel (gancho + blocos de fala + texto na tela).
-- slides = entregável de carrossel. Os campos de token existem pra dar pra
-- medir se o prompt caching está valendo a pena.
create table if not exists cont_posts (
  id                 serial primary key,
  pauta_id           integer references cont_pautas(id) on delete set null,
  produto_id         integer references cont_produtos(id) on delete set null,
  pilar              text not null,
  formato            text not null default 'reel',
  status             text not null default 'rascunho', -- rascunho|aprovado|agendado|publicado|erro|arquivado
  titulo             text not null default '',
  tema               text not null default '',
  roteiro            jsonb,
  slides             jsonb not null default '[]'::jsonb,
  legenda            text not null default '',
  hashtags           jsonb not null default '[]'::jsonb,
  cta                text not null default '',
  modelo             text not null default '',
  tokens_entrada     integer not null default 0,
  tokens_saida       integer not null default 0,
  tokens_cache_lidos integer not null default 0,
  agendado_para      timestamptz,
  publicado_em       timestamptz,
  criado_por         text not null default '',
  criado_em          timestamptz not null default now(),
  atualizado_em      timestamptz not null default now()
);
create index if not exists cont_posts_status_idx on cont_posts (status, criado_em);
create index if not exists cont_posts_agenda_idx on cont_posts (agendado_para);

-- ── Biblioteca de imagens ─────────────────────────────────────────────────
-- tipo 'uso' = imagem que vai no post. tipo 'referencia' = print/mockup que
-- serve só de inspiração de estilo, nunca pra copiar.
create table if not exists cont_assets (
  id            serial primary key,
  blob_url      text not null,
  blob_pathname text not null default '',
  tipo          text not null default 'uso',  -- uso|referencia
  mime          text not null default '',
  largura       integer not null default 0,
  altura        integer not null default 0,
  bytes         integer not null default 0,
  titulo        text not null default '',
  descricao_ia  text not null default '',
  tags          jsonb not null default '[]'::jsonb,
  enviado_por   text not null default '',
  criado_em     timestamptz not null default now()
);
create index if not exists cont_assets_tipo_idx on cont_assets (tipo, criado_em);

create table if not exists cont_post_assets (
  id       serial primary key,
  post_id  integer not null references cont_posts(id) on delete cascade,
  asset_id integer not null references cont_assets(id) on delete cascade,
  ordem    integer not null default 0,
  papel    text not null default 'principal' -- principal|slide|referencia
);
create unique index if not exists cont_post_assets_unq
  on cont_post_assets (post_id, asset_id, papel);

-- Prompts de imagem: a plataforma NÃO gera imagem, gera o prompt detalhado
-- que é usado em outro sistema.
create table if not exists cont_image_prompts (
  id              serial primary key,
  post_id         integer not null references cont_posts(id) on delete cascade,
  slide_idx       integer not null default 0,
  objetivo        text not null default '',
  prompt          text not null,
  negative_prompt text not null default '',
  parametros      jsonb not null default '{}'::jsonb,
  criado_em       timestamptz not null default now()
);
create index if not exists cont_image_prompts_post_idx
  on cont_image_prompts (post_id, slide_idx);

-- ── Publicação ────────────────────────────────────────────────────────────
-- As tabelas já existem na v1 mesmo com publicação automática só na etapa 5:
-- o publisher "manual" (pacote pronto) grava aqui, então o histórico é o
-- mesmo desde o dia 1.
create table if not exists cont_contas (
  id          serial primary key,
  plataforma  text not null,                   -- instagram|linkedin|threads|x
  handle      text not null default '',
  ativo       boolean not null default true,
  credenciais jsonb not null default '{}'::jsonb,
  expira_em   timestamptz,
  criado_em   timestamptz not null default now()
);
create unique index if not exists cont_contas_unq on cont_contas (plataforma, handle);

create table if not exists cont_publicacoes (
  id           serial primary key,
  post_id      integer not null references cont_posts(id) on delete cascade,
  plataforma   text not null,
  status       text not null default 'pendente', -- pendente|publicado|erro
  external_id  text not null default '',
  permalink    text not null default '',
  erro         text not null default '',
  tentativas   integer not null default 0,
  payload      jsonb not null default '{}'::jsonb,
  publicado_em timestamptz,
  criado_em    timestamptz not null default now()
);
create index if not exists cont_publicacoes_post_idx on cont_publicacoes (post_id);

-- ── Fila de jobs ──────────────────────────────────────────────────────────
-- Vercel Cron faz o poll. Nada de Redis/QStash neste volume.
create table if not exists cont_jobs (
  id           serial primary key,
  tipo         text not null,  -- sync_vault|compilar_brief|descrever_asset|publicar
  payload      jsonb not null default '{}'::jsonb,
  status       text not null default 'pendente', -- pendente|rodando|concluido|erro
  tentativas   integer not null default 0,
  rodar_apos   timestamptz not null default now(),
  erro         text not null default '',
  criado_em    timestamptz not null default now(),
  concluido_em timestamptz
);
create index if not exists cont_jobs_fila_idx on cont_jobs (status, rodar_apos);
