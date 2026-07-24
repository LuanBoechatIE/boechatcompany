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
alter table crm_clientes add column if not exists logo                text not null default '';

-- Atividades/histórico dos leads.
create table if not exists lead_atividades (
  id         serial primary key,
  lead_id    integer not null references leads(id) on delete cascade,
  tipo       text not null default 'nota',   -- nota|tarefa|evento|ligacao|whatsapp|email|reuniao|mensagem|visita|proposta|auditoria|outro
  texto      text not null default '',
  data       timestamptz,
  feito      boolean not null default false,
  autor      text not null default '',
  criado_em  timestamptz not null default now()
);
create index if not exists lead_atividades_lead_idx on lead_atividades(lead_id);
create index if not exists leads_status_idx on leads(status);

-- ── Sales Command Center (Fase 1): comando comercial dos leads ───────────────
-- Colunas novas do lead (idempotente).
alter table leads add column if not exists prioridade                   text not null default 'media';
alter table leads add column if not exists lead_score                   integer not null default 0;
alter table leads add column if not exists score_fixo                   integer;
alter table leads add column if not exists ultima_interacao_em          timestamptz;
alter table leads add column if not exists proximo_contato_responsavel  text not null default '';
alter table leads add column if not exists atualizado_em                timestamptz;

-- Auditoria com valor anterior/novo na própria timeline de atividades.
alter table lead_atividades add column if not exists campo          text not null default '';
alter table lead_atividades add column if not exists valor_anterior text not null default '';
alter table lead_atividades add column if not exists valor_novo     text not null default '';

create index if not exists leads_ultima_interacao_idx on leads(ultima_interacao_em);
create index if not exists leads_proximo_contato_idx on leads(proximo_contato);

-- Checklist do lead.
create table if not exists lead_checklist (
  id         serial primary key,
  lead_id    integer not null references leads(id) on delete cascade,
  texto      text not null default '',
  feito      boolean not null default false,
  ordem      integer not null default 0,
  criado_em  timestamptz not null default now()
);
create index if not exists lead_checklist_lead_idx on lead_checklist(lead_id);

-- Arquivos anexados ao lead (Vercel Blob).
create table if not exists lead_arquivos (
  id         serial primary key,
  lead_id    integer not null references leads(id) on delete cascade,
  nome       text not null default '',
  url        text not null default '',
  tamanho    integer not null default 0,
  autor      text not null default '',
  criado_em  timestamptz not null default now()
);
create index if not exists lead_arquivos_lead_idx on lead_arquivos(lead_id);

-- Filtros salvos (favoritos) do pipeline.
create table if not exists lead_filtros_salvos (
  id         serial primary key,
  nome       text not null,
  autor      text not null default '',
  filtro     jsonb not null default '{}'::jsonb,
  criado_em  timestamptz not null default now()
);

-- ── Sales OS (motor de cadência) ─────────────────────────────────────────────
alter table leads add column if not exists cadencia_passo      integer not null default 0;
alter table leads add column if not exists proxima_acao_tipo   text not null default 'ligar';
alter table leads add column if not exists encerrado           boolean not null default false;
alter table leads add column if not exists motivo_encerramento text not null default '';
alter table leads add column if not exists reuniao_evento_id   integer;
alter table leads add column if not exists reuniao_meet_link   text not null default '';
alter table leads add column if not exists reuniao_tipo        text not null default '';

-- ── Gestão de equipe comercial ────────────────────────────────────────────────
-- Ownership real do lead (dono do lead = vendedor responsável).
alter table leads add column if not exists usuario_id integer;
alter table lead_atividades add column if not exists usuario_id integer;
create index if not exists leads_usuario_idx on leads(usuario_id);
create index if not exists lead_atividades_usuario_idx on lead_atividades(usuario_id);

-- Backfill best-effort a partir dos campos de texto já existentes (idempotente:
-- só preenche onde ainda está null, nunca sobrescreve).
update leads l set usuario_id = u.id
from usuarios u
where l.usuario_id is null and l.responsavel <> '' and lower(u.nome_completo) = lower(l.responsavel);

update lead_atividades a set usuario_id = u.id
from usuarios u
where a.usuario_id is null and a.autor <> '' and lower(u.username) = lower(a.autor);

-- Novas permissões (visão de equipe + reatribuição de lead).
insert into permissions (chave, modulo, acao, label) values
  ('equipe.visualizar_tudo','equipe','visualizar_tudo','Ver leads e métricas de toda a equipe'),
  ('leads.reatribuir','leads','reatribuir','Reatribuir responsável de um lead')
  on conflict (chave) do nothing;

-- Role Diretor Comercial: visão completa do CRM comercial, sem acesso a
-- usuários/permissões (isso continua exclusivo de super_admin/Dono).
insert into roles (chave, nome, descricao, sup) values
  ('diretor_comercial', 'Diretor Comercial', 'Visão completa da equipe comercial, sem acesso a configurações administrativas', false)
  on conflict (chave) do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r
cross join permissions p
where r.chave = 'diretor_comercial'
  and p.modulo <> 'usuarios'
on conflict do nothing;

alter table lead_atividades add column if not exists resultado text not null default '';
alter table lead_atividades add column if not exists canal     text not null default '';

-- Metas diárias de prospecção por vendedor.
create table if not exists metas_prospeccao (
  id            serial primary key,
  autor         text not null unique,
  ligacoes      integer not null default 60,
  atendidas     integer not null default 20,
  decisores     integer not null default 12,
  reunioes      integer not null default 5,
  whatsapps     integer not null default 15,
  followups     integer not null default 10,
  atualizado_em timestamptz not null default now()
);

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

-- ── Google Calendar (integração de agenda) ──────────────────────────────────
create table if not exists google_calendar_connections (
  id                       serial primary key,
  google_account_email     text not null default '',
  calendar_id              text not null default 'primary',
  calendar_name            text not null default '',
  encrypted_access_token   text not null default '',
  encrypted_refresh_token  text not null default '',
  token_expires_at         timestamptz,
  scopes                   text not null default '',
  sync_token               text not null default '',
  status                   text not null default 'conectado',
  last_synced_at           timestamptz,
  connected_by             text not null default '',
  criado_em                timestamptz not null default now(),
  atualizado_em            timestamptz not null default now()
);

create table if not exists google_calendar_channels (
  id                           serial primary key,
  connection_id                integer not null references google_calendar_connections(id) on delete cascade,
  channel_id                   text not null,
  resource_id                  text not null default '',
  encrypted_verification_token text not null default '',
  expires_at                   timestamptz,
  status                       text not null default 'ativo',
  criado_em                    timestamptz not null default now(),
  atualizado_em                timestamptz not null default now()
);

create table if not exists calendar_events (
  id                serial primary key,
  title             text not null default '',
  description       text not null default '',
  type              text not null default 'evento',
  cliente_id        integer references crm_clientes(id) on delete set null,
  projeto_id        integer references projetos(id) on delete set null,
  organizer_user_id text not null default '',
  start_at          timestamptz not null,
  end_at            timestamptz not null,
  all_day           boolean not null default false,
  timezone          text not null default 'America/Sao_Paulo',
  location          text not null default '',
  meet_link         text not null default '',
  recurrence_rule   text not null default '',
  status            text not null default 'confirmado',
  source            text not null default 'boechat',
  created_by        text not null default '',
  updated_by        text not null default '',
  criado_em         timestamptz not null default now(),
  atualizado_em     timestamptz not null default now()
);

create table if not exists calendar_event_attendees (
  id              serial primary key,
  event_id        integer not null references calendar_events(id) on delete cascade,
  name            text not null default '',
  email           text not null,
  optional        boolean not null default false,
  response_status text not null default 'needsAction',
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);

create table if not exists calendar_event_integrations (
  id                 serial primary key,
  calendar_event_id  integer references calendar_events(id) on delete cascade,
  entity_type        text not null default 'evento',
  entity_id          integer,
  connection_id      integer not null references google_calendar_connections(id) on delete cascade,
  google_event_id    text not null,
  google_calendar_id text not null default 'primary',
  google_etag        text not null default '',
  google_updated_at  timestamptz,
  last_sync_direction text not null default '',
  last_synced_at     timestamptz,
  status             text not null default 'ativo',
  criado_em          timestamptz not null default now(),
  atualizado_em      timestamptz not null default now()
);
create unique index if not exists cal_event_int_conn_gid on calendar_event_integrations(connection_id, google_event_id);
create index if not exists cal_event_int_entity on calendar_event_integrations(entity_type, entity_id);

create table if not exists calendar_sync_logs (
  id                serial primary key,
  connection_id     integer references google_calendar_connections(id) on delete cascade,
  direction         text not null default '',
  action            text not null default '',
  status            text not null default '',
  message           text not null default '',
  google_event_id   text not null default '',
  internal_event_id integer,
  started_at        timestamptz not null default now(),
  finished_at       timestamptz
);
create index if not exists calendar_events_start_idx on calendar_events(start_at);
create index if not exists calendar_att_event_idx on calendar_event_attendees(event_id);

-- ── Usuários (perfil + credenciais opcionais) ───────────────────────────────
create table if not exists usuarios (
  id                      serial primary key,
  username                text not null unique,
  nome_completo           text not null default '',
  email                   text not null default '',
  foto                    text not null default '',
  cargos                  jsonb not null default '[]'::jsonb,
  preferencias            jsonb not null default '{}'::jsonb,
  senha_hash              text not null default '',
  troca_senha_obrigatoria boolean not null default false,
  status                  text not null default 'ativo',
  criado_em               timestamptz not null default now(),
  ultimo_acesso           timestamptz
);

-- ── Cargos + Roles/Permissões (Etapa 2 de usuários) ─────────────────────────
create table if not exists cargos (
  id        serial primary key,
  nome      text not null unique,
  cor       text not null default '#a78bfa',
  ativo     boolean not null default true,
  criado_em timestamptz not null default now()
);
create table if not exists user_cargos (
  id         serial primary key,
  usuario_id integer not null references usuarios(id) on delete cascade,
  cargo_id   integer not null references cargos(id) on delete cascade
);
create unique index if not exists user_cargos_uniq on user_cargos(usuario_id, cargo_id);

create table if not exists roles (
  id        serial primary key,
  chave     text not null unique,
  nome      text not null default '',
  descricao text not null default '',
  sup       boolean not null default false,
  ativo     boolean not null default true
);
create table if not exists permissions (
  id     serial primary key,
  chave  text not null unique,
  modulo text not null default '',
  acao   text not null default '',
  label  text not null default ''
);
create table if not exists role_permissions (
  id            serial primary key,
  role_id       integer not null references roles(id) on delete cascade,
  permission_id integer not null references permissions(id) on delete cascade
);
create unique index if not exists role_permissions_uniq on role_permissions(role_id, permission_id);
create table if not exists user_roles (
  id         serial primary key,
  usuario_id integer not null references usuarios(id) on delete cascade,
  role_id    integer not null references roles(id) on delete cascade
);
create unique index if not exists user_roles_uniq on user_roles(usuario_id, role_id);
create table if not exists user_permission_overrides (
  id            serial primary key,
  usuario_id    integer not null references usuarios(id) on delete cascade,
  permission_id integer not null references permissions(id) on delete cascade,
  permitido     boolean not null default true
);
create unique index if not exists user_perm_ovr_uniq on user_permission_overrides(usuario_id, permission_id);

-- Seed: role de superadministrador e cargos iniciais (idempotente).
insert into roles (chave, nome, descricao, sup) values
  ('super_admin', 'Superadministrador', 'Acesso total ao sistema', true)
  on conflict (chave) do nothing;
insert into roles (chave, nome, descricao, sup) values
  ('membro', 'Membro', 'Acesso básico de visualização', false)
  on conflict (chave) do nothing;

insert into cargos (nome, cor) values
  ('Administrador', '#a78bfa'),
  ('Gestor de Tráfego', '#38bdf8'),
  ('Designer', '#f472b6'),
  ('Social Media', '#34d399'),
  ('Comercial', '#fbbf24'),
  ('Atendimento', '#22d3ee'),
  ('Financeiro', '#f87171'),
  ('Gestor de Projetos', '#818cf8')
  on conflict (nome) do nothing;

-- Catálogo de permissões por módulo (idempotente).
insert into permissions (chave, modulo, acao, label) values
  ('dashboard.visualizar','dashboard','visualizar','Ver dashboard'),
  ('leads.visualizar','leads','visualizar','Ver leads'),
  ('leads.criar','leads','criar','Criar leads'),
  ('leads.editar','leads','editar','Editar leads'),
  ('leads.excluir','leads','excluir','Excluir leads'),
  ('leads.exportar','leads','exportar','Exportar leads'),
  ('clientes.visualizar','clientes','visualizar','Ver clientes'),
  ('clientes.criar','clientes','criar','Criar clientes'),
  ('clientes.editar','clientes','editar','Editar clientes'),
  ('clientes.arquivar','clientes','arquivar','Arquivar clientes'),
  ('clientes.excluir','clientes','excluir','Excluir clientes'),
  ('financeiro.visualizar','financeiro','visualizar','Ver financeiro'),
  ('financeiro.editar','financeiro','editar','Editar financeiro'),
  ('financeiro.exportar','financeiro','exportar','Exportar financeiro'),
  ('projetos.visualizar','projetos','visualizar','Ver projetos'),
  ('projetos.criar','projetos','criar','Criar projetos'),
  ('projetos.editar','projetos','editar','Editar projetos'),
  ('projetos.excluir','projetos','excluir','Excluir projetos'),
  ('demandas.visualizar','demandas','visualizar','Ver demandas'),
  ('demandas.criar','demandas','criar','Criar demandas'),
  ('demandas.editar','demandas','editar','Editar demandas'),
  ('demandas.excluir','demandas','excluir','Excluir demandas'),
  ('estrategia.visualizar','estrategia','visualizar','Ver estratégia'),
  ('estrategia.editar','estrategia','editar','Editar estratégia'),
  ('trafego.visualizar','trafego','visualizar','Ver tráfego'),
  ('trafego.configurar','trafego','configurar','Configurar integrações'),
  ('trafego.exportar','trafego','exportar','Exportar tráfego'),
  ('calendario.visualizar','calendario','visualizar','Ver calendário'),
  ('calendario.criar','calendario','criar','Criar eventos'),
  ('calendario.editar','calendario','editar','Editar eventos'),
  ('calendario.excluir','calendario','excluir','Excluir eventos'),
  ('usuarios.visualizar','usuarios','visualizar','Ver usuários'),
  ('usuarios.criar','usuarios','criar','Criar usuários'),
  ('usuarios.editar','usuarios','editar','Editar usuários'),
  ('usuarios.bloquear','usuarios','bloquear','Bloquear usuários'),
  ('usuarios.redefinir_senha','usuarios','redefinir_senha','Redefinir senha'),
  ('usuarios.gerenciar_permissoes','usuarios','gerenciar_permissoes','Gerenciar permissões'),
  ('cargos.gerenciar','cargos','gerenciar','Gerenciar cargos'),
  ('audit.visualizar','audit','visualizar','Ver logs de auditoria')
  on conflict (chave) do nothing;

-- ── Aprovação de demandas (Etapa 4 — conclusão × aprovação) ─────────────────
-- Camada de APROVAÇÃO separada da execução (o Kanban continua usando `status`).
alter table demandas add column if not exists approval_status           text not null default 'nao_enviada';
alter table demandas add column if not exists completed_at              timestamptz;
alter table demandas add column if not exists completed_by              text not null default '';
alter table demandas add column if not exists submitted_for_approval_at timestamptz;
alter table demandas add column if not exists current_approval_round    integer not null default 0;
alter table demandas add column if not exists approved_at               timestamptz;
alter table demandas add column if not exists reopened_at               timestamptz;

create table if not exists demand_approvals (
  id                 serial primary key,
  demanda_id         integer not null references demandas(id) on delete cascade,
  rodada             integer not null default 1,
  status             text not null,                 -- PENDING|APPROVED|CHANGES_REQUESTED|REJECTED|REVOKED
  approver_type      text not null default '',      -- INTERNAL_USER|CLIENT
  approver_user_id   text not null default '',
  approver_nome      text not null default '',
  approval_source    text not null default '',      -- INTERNAL_ADMIN|EMPLOYEE_REPORTED_CLIENT_APPROVAL|CLIENT_PORTAL
  reported_by_user_id text not null default '',
  canal              text not null default '',
  nota               text not null default '',
  decidido_em        timestamptz,
  revogado_em        timestamptz,
  revogado_por       text not null default '',
  motivo_revogacao   text not null default '',
  criado_em          timestamptz not null default now()
);
create index if not exists demand_approvals_demanda_idx on demand_approvals(demanda_id);
create index if not exists demand_approvals_status_idx on demand_approvals(status);
create index if not exists demandas_approval_status_idx on demandas(approval_status);

-- Permissões de demandas/aprovação (idempotente).
insert into permissions (chave, modulo, acao, label) values
  ('demandas.complete_own','demandas','complete_own','Concluir as próprias demandas'),
  ('demandas.complete_any','demandas','complete_any','Concluir demandas de outros'),
  ('demandas.submit_for_approval','demandas','submit_for_approval','Enviar para aprovação'),
  ('demandas.report_client_approval','demandas','report_client_approval','Registrar aprovação do cliente'),
  ('demandas.approve','demandas','approve','Aprovar demandas'),
  ('demandas.reject','demandas','reject','Rejeitar demandas'),
  ('demandas.request_changes','demandas','request_changes','Solicitar alterações'),
  ('demandas.revoke_approval','demandas','revoke_approval','Cancelar aprovação'),
  ('demandas.view_approval_history','demandas','view_approval_history','Ver histórico de aprovação')
  on conflict (chave) do nothing;

-- ── Contas: proteção de superadmin, soft delete, cargos visíveis, auditoria ──
alter table usuarios add column if not exists protected_super_admin boolean not null default false;
alter table usuarios add column if not exists deleted_at      timestamptz;
alter table usuarios add column if not exists deleted_by      text not null default '';
alter table usuarios add column if not exists deletion_reason text not null default '';

alter table user_cargos add column if not exists visivel_no_perfil boolean not null default true;
alter table user_cargos add column if not exists ordem integer not null default 0;

create table if not exists audit_logs (
  id         serial primary key,
  ator       text not null default '',
  afetado    text not null default '',
  acao       text not null,
  resultado  text not null default 'ok',
  detalhe    text not null default '',
  antes      text not null default '',
  depois     text not null default '',
  criado_em  timestamptz not null default now()
);
create index if not exists audit_logs_criado_idx on audit_logs(criado_em);

-- Permissões novas (idempotente).
insert into permissions (chave, modulo, acao, label) values
  ('usuarios.excluir','usuarios','excluir','Excluir contas'),
  ('users.login.update','usuarios','login_update','Alterar login')
  on conflict (chave) do nothing;

-- Marca Samuel e Luan como superadmin protegidos (por username; idempotente).
-- Ajuste a lista aqui se os usernames forem outros.
update usuarios set protected_super_admin = true
  where lower(username) in ('samuel', 'luan');

-- ── Ponto / jornada de trabalho (time tracking) ─────────────────────────────
create table if not exists work_shifts (
  id                   serial primary key,
  usuario_id           integer not null references usuarios(id) on delete cascade,
  work_date            text not null,
  started_at           timestamptz,
  ended_at             timestamptz,
  status               text not null default 'aberta',
  total_worked_seconds integer not null default 0,
  total_paused_seconds integer not null default 0,
  flagged              boolean not null default false,
  flag_reason          text not null default '',
  criado_em            timestamptz not null default now(),
  atualizado_em        timestamptz not null default now()
);
create index if not exists work_shifts_usuario_idx on work_shifts(usuario_id, work_date);

create table if not exists work_shift_events (
  id          serial primary key,
  shift_id    integer not null references work_shifts(id) on delete cascade,
  usuario_id  integer not null,
  event_type  text not null,
  occurred_at timestamptz not null default now(),
  source      text not null default 'web',
  criado_em   timestamptz not null default now()
);
create index if not exists work_shift_events_shift_idx on work_shift_events(shift_id);

insert into permissions (chave, modulo, acao, label) values
  ('time_tracking.use','ponto','use','Registrar o próprio ponto'),
  ('time_tracking.view_own','ponto','view_own','Ver o próprio ponto'),
  ('time_tracking.view_team','ponto','view_team','Ver o ponto da equipe'),
  ('time_tracking.manage','ponto','manage','Administrar registros de ponto')
  on conflict (chave) do nothing;

-- Reforma Contas/Cargos/Permissões: catálogo expandido pra cobrir todas as
-- áreas reais do sistema (não só o CRM comercial).
insert into permissions (chave, modulo, acao, label) values
  ('onboardings.visualizar','onboardings','visualizar','Ver onboardings'),
  ('onboardings.criar','onboardings','criar','Criar onboardings'),
  ('onboardings.editar','onboardings','editar','Editar onboardings'),
  ('onboardings.excluir','onboardings','excluir','Excluir onboardings'),
  ('onboardings.gerenciar','onboardings','gerenciar','Gerenciar onboardings'),
  ('presets.visualizar','presets','visualizar','Ver presets'),
  ('presets.criar','presets','criar','Criar presets'),
  ('presets.editar','presets','editar','Editar presets'),
  ('presets.excluir','presets','excluir','Excluir presets'),
  ('presets.gerenciar','presets','gerenciar','Gerenciar presets'),
  ('respostas_formulario.visualizar','respostas_formulario','visualizar','Ver respostas de formulários'),
  ('respostas_formulario.alterar_status','respostas_formulario','alterar_status','Alterar status de respostas'),
  ('respostas_formulario.observacoes','respostas_formulario','observacoes','Adicionar observações em respostas'),
  ('respostas_formulario.exportar','respostas_formulario','exportar','Exportar respostas'),
  ('respostas_formulario.excluir','respostas_formulario','excluir','Excluir respostas'),
  ('respostas_formulario.gerenciar','respostas_formulario','gerenciar','Gerenciar respostas de formulários'),
  ('recrutamento.visualizar','recrutamento','visualizar','Ver recrutamento'),
  ('recrutamento.criar','recrutamento','criar','Criar vagas/candidatos'),
  ('recrutamento.editar','recrutamento','editar','Editar recrutamento'),
  ('recrutamento.excluir','recrutamento','excluir','Excluir recrutamento'),
  ('recrutamento.gerenciar','recrutamento','gerenciar','Gerenciar recrutamento'),
  ('mapas.visualizar','mapas','visualizar','Ver mapas mentais'),
  ('mapas.editar','mapas','editar','Editar mapas mentais'),
  ('contratos.visualizar','contratos','visualizar','Ver contratos'),
  ('contratos.criar','contratos','criar','Criar contratos'),
  ('contratos.gerenciar','contratos','gerenciar','Gerenciar contratos'),
  ('administracao_contas.visualizar','administracao_contas','visualizar','Ver administração de contas'),
  ('administracao_contas.criar_conta','administracao_contas','criar_conta','Criar conta de funcionário'),
  ('administracao_contas.editar_conta','administracao_contas','editar_conta','Editar conta de funcionário'),
  ('administracao_contas.excluir_conta','administracao_contas','excluir_conta','Excluir conta de funcionário'),
  ('administracao_contas.alterar_cargos','administracao_contas','alterar_cargos','Alterar cargos de funcionário'),
  ('administracao_contas.gerenciar_permissoes','administracao_contas','gerenciar_permissoes','Gerenciar permissões de funcionário')
  on conflict (chave) do nothing;

-- Etapa 5: o menu passa a exigir permissão em (quase) todo item. Antes disso
-- nenhuma dessas áreas era protegida, então SEM esse seed todo funcionário
-- sem cargo de acesso perderia o menu inteiro no primeiro login depois do
-- deploy. Dá pro cargo "membro" (já seedado) a mesma visão que todo mundo já
-- tinha por padrão, e garante que toda conta ativa sem nenhuma role tenha
-- "membro" — preserva o acesso atual. Superadmin aperta por cargo depois,
-- na aba Cargos de Acesso.
insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r
cross join permissions p
where r.chave = 'membro'
  and p.chave in (
    'dashboard.visualizar','leads.visualizar','clientes.visualizar','projetos.visualizar',
    'demandas.visualizar','estrategia.visualizar','trafego.visualizar','calendario.visualizar',
    'mapas.visualizar','onboardings.visualizar','presets.visualizar','contratos.visualizar',
    'recrutamento.visualizar'
  )
on conflict do nothing;

insert into user_roles (usuario_id, role_id)
select u.id, r.id
from usuarios u
cross join roles r
where r.chave = 'membro'
  and u.deleted_at is null
  and not exists (select 1 from user_roles ur where ur.usuario_id = u.id)
on conflict do nothing;

-- Etapa 6: agora exigirPermissao(...) roda de verdade em criar/editar/excluir
-- (antes só checava login). Mesma lógica da Etapa 5: dá pro "membro" as ações
-- que qualquer logado já conseguia fazer, pra não quebrar ninguém.
insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r
cross join permissions p
where r.chave = 'membro'
  and p.chave in (
    'leads.criar','leads.editar','leads.excluir',
    'clientes.criar','clientes.editar',
    'projetos.criar','projetos.excluir',
    'demandas.criar','demandas.excluir',
    'estrategia.editar',
    'mapas.editar',
    'calendario.criar','calendario.excluir',
    'trafego.configurar',
    'presets.criar','presets.editar','presets.excluir','presets.gerenciar',
    'onboardings.criar','onboardings.editar','onboardings.excluir',
    'recrutamento.criar','recrutamento.editar','recrutamento.excluir','recrutamento.gerenciar'
  )
on conflict do nothing;
