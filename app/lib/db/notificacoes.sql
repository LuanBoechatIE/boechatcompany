-- Notificações em tempo real (histórico). Idempotente.
create table if not exists notificacoes (
  id serial primary key,
  tipo text not null,
  mensagem text not null,
  payload jsonb not null default '{}',
  criado_em timestamptz not null default now()
);

create index if not exists notificacoes_tipo_criado_idx on notificacoes (tipo, criado_em desc);
