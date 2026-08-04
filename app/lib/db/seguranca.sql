-- Segurança: limite de tentativas (rate limit) e auditoria com origem.
-- Como usar: no console do Neon, abra o SQL Editor, cole TUDO isto e rode
-- uma vez. É idempotente (pode rodar de novo sem quebrar).

-- ── Limite de tentativas ────────────────────────────────────────────────────
--
-- Um contador por CHAVE, em janela fixa. A chave nunca guarda o dado original
-- (login tentado, IP): guarda um hash com prefixo de escopo. Duas razões:
--
--   1. Tamanho fixo. Sem isso, alguém enche a tabela mandando logins de 10 KB.
--   2. Esta tabela não pode virar uma lista legível de quem tentou entrar,
--      nem de quais IPs acessaram. Pro limite funcionar basta saber que a
--      MESMA origem repetiu, não quem ela é.
--
-- `janela_inicio` é quando a contagem atual começou. Quando a janela vence, o
-- próprio upsert zera o contador e reabre a janela: não existe rotina de
-- expiração pra manter.
create table if not exists rate_limits (
  chave         text primary key,
  tentativas    integer not null default 0,
  janela_inicio timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Usado pela faxina de linhas velhas.
create index if not exists rate_limits_janela_idx on rate_limits(janela_inicio);

-- ── Auditoria: de onde veio a ação ──────────────────────────────────────────
--
-- Sem isso, "login falhou" não responde a única pergunta que importa num
-- incidente: falhou vindo de onde. As duas colunas nascem vazias pra não
-- quebrar as linhas que já existem.
alter table audit_logs add column if not exists ip         text not null default '';
alter table audit_logs add column if not exists user_agent text not null default '';

-- Investigação de incidente lê por ação e por tempo ("todas as falhas de
-- login da última hora"), então o índice acompanha essa consulta.
create index if not exists audit_logs_acao_criado_idx on audit_logs(acao, criado_em desc);
