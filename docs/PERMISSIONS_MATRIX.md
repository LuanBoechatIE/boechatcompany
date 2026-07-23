# Matriz de permissões

Permissões vivem na tabela `permissions` (chave `modulo.acao`). Super_admin (role
`super_admin`, flag `sup=true`) implica TODAS. Resolução: `app/lib/permissoes.ts`.

## Contas protegidas
- `usuarios.protected_super_admin = true` para Samuel e Luan (bootstrap por
  username em `crm.sql` + no provisionamento). Não podem ser bloqueadas,
  excluídas, nem perder superadmin (backend recusa + audita).

## Permissões por módulo (catálogo atual)
- dashboard: visualizar
- leads: visualizar, criar, editar, excluir, exportar
- clientes: visualizar, criar, editar, arquivar, excluir
- financeiro: visualizar, editar, exportar  *(enforcement pendente — base Etapa 4)*
- projetos / demandas: visualizar, criar, editar, excluir
- demandas (aprovação): complete_own, complete_any, submit_for_approval,
  report_client_approval, approve, reject, request_changes, revoke_approval,
  view_approval_history
- estrategia: visualizar, editar
- trafego: visualizar, configurar, exportar
- calendario: visualizar, criar, editar, excluir
- usuarios: visualizar, criar, editar, bloquear, redefinir_senha,
  gerenciar_permissoes, excluir
- users.login.update (alterar login) — só superadmin inicialmente
- cargos.gerenciar, audit.visualizar

## Config inicial
- Superadmin (Samuel/Luan): todas.
- Funcionários: nenhuma por padrão (concessão pontual depende da MATRIZ DE
  PERMISSÕES POR USUÁRIO, ainda não implementada — base Etapa 4).

## Pendente
- UI para conceder permissões individuais (user_permission_overrides) — a tabela
  existe e o resolvedor já aplica overrides; falta a interface.
