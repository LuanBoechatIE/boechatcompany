# Estado do projeto (CRM Boechat)

## Concluído (recente → antigo)
- Ajustes de contas/perfil/config (proteção Samuel/Luan, soft delete, alterar
  login, cargos visíveis, scrollbar roxa, auditoria) — esta sessão.
- Aprovação de demandas (execução × aprovação, rodadas, histórico).
- Usuários Etapas 1-3 (perfil, cargos/roles/superadmin, administração de contas).
- Calendário Fase 1 (Google Agenda OAuth + sync + Meet).
- Painel de Tráfego por cliente + export.

## Pendente (fila)
- CropModal da foto de perfil (item aberto desta etapa).
- Base da Etapa 4: proteção Financeiro (finance.view), exclusão de clientes
  (clients.delete), matriz de permissões por usuário, ponto/horas, times,
  ranking, dashboard, auditoria (UI).
- Calendário Fases 2-4.

## Deploy
- Rodar `app/lib/db/crm.sql` no Neon (idempotente) para novas colunas.
- Sem env vars novas nesta etapa.
