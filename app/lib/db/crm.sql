-- CRM / gestão interna (portado do SammaS Hub).
-- Como usar: no console do Neon (ou SQL Editor da Vercel), cole TUDO e rode
-- uma vez. É idempotente (pode rodar de novo sem quebrar).

create table if not exists leads (
  id           serial primary key,
  nome         text not null,
  email        text not null default '',
  whatsapp     text not null default '',
  empresa      text not null default '',
  setor        text not null default '',
  faturamento  text not null default '',
  status       text not null default 'novo',      -- novo|contato|proposta|ganho|perdido
  origem       text not null default 'manual',    -- site|manual
  criado_em    timestamptz not null default now()
);

create table if not exists crm_clientes (
  id         serial primary key,
  nome       text not null,
  empresa    text not null default '',
  email      text not null default '',
  whatsapp   text not null default '',
  lead_id    integer references leads(id) on delete set null,
  criado_em  timestamptz not null default now()
);

create table if not exists projetos (
  id          serial primary key,
  cliente_id  integer references crm_clientes(id) on delete cascade,
  nome        text not null,
  briefing    text not null default '',
  status      text not null default 'planejamento', -- planejamento|andamento|revisao|concluido
  prazo       timestamptz,
  criado_em   timestamptz not null default now()
);

create table if not exists tarefas (
  id           serial primary key,
  projeto_id   integer not null references projetos(id) on delete cascade,
  titulo       text not null,
  descricao    text not null default '',
  status       text not null default 'todo',   -- todo|doing|review|done
  responsavel  text not null default '',
  prioridade   text not null default 'media',  -- baixa|media|alta
  prazo        timestamptz,
  ordem        integer not null default 0,
  criado_em    timestamptz not null default now()
);

create table if not exists demandas (
  id           serial primary key,
  titulo       text not null,
  descricao    text not null default '',
  status       text not null default 'backlog', -- backlog|andamento|revisao|concluido
  prioridade   text not null default 'media',   -- baixa|media|alta|urgente
  cliente_id   integer references crm_clientes(id) on delete set null,
  responsavel  text not null default '',
  prazo        timestamptz,
  ordem        integer not null default 0,
  criado_em    timestamptz not null default now(),
  atualizado_em timestamptz
);

create table if not exists estrategia_items (
  id           serial primary key,
  cliente_id   integer references crm_clientes(id) on delete cascade,
  fase         text not null default 'fundacao', -- fundacao|trafego_pago|organico|conteudo|reputacao
  titulo       text not null,
  descricao    text not null default '',
  responsavel  text not null default '',
  status       text not null default 'todo',    -- todo|doing|done
  prioridade   text not null default 'media',
  ordem        integer not null default 0,
  criado_em    timestamptz not null default now()
);

create table if not exists mapas_mentais (
  id            serial primary key,
  titulo        text not null default 'Novo mapa',
  cliente_id    integer references crm_clientes(id) on delete set null,
  nodes         jsonb not null default '[]'::jsonb,
  edges         jsonb not null default '[]'::jsonb,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Idempotente: garante colunas novas em bancos que já rodaram uma versão
-- anterior deste arquivo.
alter table demandas add column if not exists atualizado_em timestamptz;

-- Leads: campos do pipeline comercial (Fase 1 do CRM comercial).
alter table leads add column if not exists pessoa_contato text not null default '';
alter table leads add column if not exists telefone       text not null default '';
alter table leads add column if not exists servico        text not null default '';
alter table leads add column if not exists responsavel    text not null default '';
alter table leads add column if not exists valor_estimado numeric(12,2);
alter table leads add column if not exists proxima_acao   text not null default '';
alter table leads add column if not exists proximo_contato timestamptz;
alter table leads add column if not exists tags           text not null default '';
alter table leads add column if not exists observacoes    text not null default '';
alter table leads add column if not exists motivo_perda   text not null default '';
alter table leads add column if not exists arquivado      boolean not null default false;

-- Migra os status antigos pro novo pipeline (idempotente).
update leads set status = 'primeiro_contato' where status = 'contato';
update leads set status = 'convertido'       where status = 'ganho';

-- Clientes CRM: dados cadastrais (Fase 3 do CRM comercial).
alter table crm_clientes add column if not exists telefone            text not null default '';
alter table crm_clientes add column if not exists segmento            text not null default '';
alter table crm_clientes add column if not exists endereco            text not null default '';
alter table crm_clientes add column if not exists cidade              text not null default '';
alter table crm_clientes add column if not exists estado              text not null default '';
alter table crm_clientes add column if not exists site                text not null default '';
alter table crm_clientes add column if not exists instagram           text not null default '';
alter table crm_clientes add column if not exists responsavel_interno text not null default '';
alter table crm_clientes add column if not exists status_cliente      text not null default 'ativo';
alter table crm_clientes add column if not exists observacoes         text not null default '';
alter table crm_clientes add column if not exists proximos_passos     text not null default '';

-- Atividades/histórico dos leads.
create table if not exists lead_atividades (
  id         serial primary key,
  lead_id    integer not null references leads(id) on delete cascade,
  tipo       text not null default 'nota',   -- nota|tarefa|evento
  texto      text not null default '',
  data       timestamptz,
  feito      boolean not null default false,
  autor      text not null default '',
  criado_em  timestamptz not null default now()
);
create index if not exists lead_atividades_lead_idx on lead_atividades(lead_id);
create index if not exists leads_status_idx on leads(status);

-- Integrações de anúncios por cliente (Fase 4). Segredos criptografados.
create table if not exists integracoes (
  id             serial primary key,
  cliente_id     integer not null references crm_clientes(id) on delete cascade,
  plataforma     text not null,                  -- meta|google
  dados          jsonb not null default '{}'::jsonb,
  segredos       text not null default '',        -- blob AES-256-GCM
  mascaras       jsonb not null default '{}'::jsonb,
  status         text not null default 'desconectado',
  ultima_sync    timestamptz,
  token_expira_em timestamptz,
  atualizado_por text not null default '',
  atualizado_em  timestamptz not null default now()
);
create unique index if not exists integracoes_cli_plat on integracoes(cliente_id, plataforma);

create table if not exists integracao_logs (
  id          serial primary key,
  cliente_id  integer not null references crm_clientes(id) on delete cascade,
  plataforma  text not null,
  acao        text not null,
  autor       text not null default '',
  criado_em   timestamptz not null default now()
);
create index if not exists integracao_logs_cli_idx on integracao_logs(cliente_id);

create index if not exists tarefas_projeto_idx on tarefas(projeto_id);
create index if not exists demandas_status_idx on demandas(status);
create index if not exists demandas_cliente_idx on demandas(cliente_id);
create index if not exists estrategia_cliente_idx on estrategia_items(cliente_id);
create index if not exists projetos_cliente_idx on projetos(cliente_id);
