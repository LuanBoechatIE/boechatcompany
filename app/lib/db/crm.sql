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
  criado_em    timestamptz not null default now()
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

create index if not exists tarefas_projeto_idx on tarefas(projeto_id);
create index if not exists demandas_status_idx on demandas(status);
create index if not exists estrategia_cliente_idx on estrategia_items(cliente_id);
create index if not exists projetos_cliente_idx on projetos(cliente_id);
