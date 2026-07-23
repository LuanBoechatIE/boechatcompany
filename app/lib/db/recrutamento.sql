-- Recrutamento (Equipe → Recrutamento). Módulo independente do onboarding de
-- clientes, mas reaproveita a tabela `presets` (construtor de formulário) e o
-- padrão de link público por token.
-- Pré-requisito: rode `schema.sql` (presets) e `crm.sql` (usuarios, cargos)
-- antes deste. Idempotente — pode rodar de novo sem quebrar.

-- Separa o construtor de formulário por módulo sem duplicar tabela/editor.
alter table presets add column if not exists escopo text not null default 'onboarding';

-- Telefone do funcionário/usuário interno (preenchido automaticamente na
-- contratação, ou editável em Configurações).
alter table usuarios add column if not exists telefone text not null default '';

create table if not exists vagas (
  id            serial primary key,
  nome          text not null,
  descricao     text not null default '',
  cargo_id      integer references cargos(id) on delete set null,
  departamento  text not null default '',
  modelo        text not null default 'presencial', -- presencial|hibrido|remoto
  cidade        text not null default '',
  status        text not null default 'rascunho',   -- rascunho|aberta|fechada
  preset_id     integer references presets(id) on delete set null,
  token         text not null unique,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz
);

create table if not exists candidaturas (
  id         serial primary key,
  vaga_id    integer not null references vagas(id) on delete cascade,
  nome       text not null,
  email      text not null default '',
  telefone   text not null default '',
  status     text not null default 'recebida', -- recebida|contratado|rejeitada
  usuario_id integer references usuarios(id) on delete set null,
  criado_em  timestamptz not null default now()
);
create index if not exists candidaturas_vaga_idx on candidaturas(vaga_id);
create index if not exists candidaturas_status_idx on candidaturas(status);

create table if not exists candidatura_respostas (
  candidatura_id integer primary key references candidaturas(id) on delete cascade,
  valores        jsonb not null default '{}'::jsonb,
  enviado_em     timestamptz not null default now()
);
