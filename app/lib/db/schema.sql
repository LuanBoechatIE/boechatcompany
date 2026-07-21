-- Onboarding: cria as tabelas no Postgres (Neon / Vercel Postgres).
-- Como usar: no painel da Vercel (ou no console do Neon), abra o SQL Editor,
-- cole TUDO isto e rode uma vez. Depois disso o onboarding funciona.
-- É idempotente (pode rodar de novo sem quebrar).

create table if not exists presets (
  id          serial primary key,
  nome        text not null,
  descricao   text not null default '',
  campos      jsonb not null default '[]'::jsonb,
  criado_em   timestamptz not null default now()
);

create table if not exists clientes (
  id             serial primary key,
  nome           text not null,
  contato        text not null default '',
  preset_id      integer not null references presets(id) on delete restrict,
  token          text not null unique,
  status         text not null default 'criado',
  criado_em      timestamptz not null default now(),
  respondido_em  timestamptz
);

create table if not exists respostas (
  cliente_id  integer primary key references clientes(id) on delete cascade,
  valores     jsonb not null default '{}'::jsonb,
  enviado_em  timestamptz not null default now()
);
