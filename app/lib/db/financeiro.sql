-- Financeiro (contratos, pagamentos, despesas) + coluna nova em demandas.
-- Alimenta a dashboard executiva em /admin/crm.
-- Como usar: no console do Neon (ou SQL Editor da Vercel), cole TUDO e rode
-- uma vez. É idempotente (pode rodar de novo sem quebrar).

create table if not exists contratos (
  id                   serial primary key,
  cliente_id           integer not null references crm_clientes(id) on delete cascade,
  projeto_id           integer references projetos(id) on delete set null,
  servico              text not null,
  valor_implementacao  numeric(12,2) not null default 0,
  valor_recorrente     numeric(12,2) not null default 0,
  status               text not null default 'ativo', -- ativo|pausado|encerrado
  data_inicio          timestamptz not null default now(),
  proxima_cobranca     timestamptz,
  criado_em            timestamptz not null default now()
);

create table if not exists pagamentos (
  id           serial primary key,
  contrato_id  integer not null references contratos(id) on delete cascade,
  cliente_id   integer not null references crm_clientes(id) on delete cascade,
  tipo         text not null default 'implementacao', -- implementacao|recorrente
  valor        numeric(12,2) not null,
  status       text not null default 'pendente',      -- pago|pendente|atrasado
  vencimento   timestamptz not null,
  pago_em      timestamptz,
  criado_em    timestamptz not null default now()
);

create table if not exists despesas (
  id          serial primary key,
  descricao   text not null,
  valor       numeric(12,2) not null,
  categoria   text not null default 'geral',
  data        timestamptz not null default now(),
  recorrente  boolean not null default false,
  criado_em   timestamptz not null default now()
);

alter table demandas add column if not exists atualizado_em timestamptz;

create index if not exists contratos_cliente_idx on contratos(cliente_id);
create index if not exists pagamentos_contrato_idx on pagamentos(contrato_id);
create index if not exists pagamentos_status_idx on pagamentos(status);
create index if not exists pagamentos_vencimento_idx on pagamentos(vencimento);
