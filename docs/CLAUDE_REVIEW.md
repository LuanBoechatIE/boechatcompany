# Revisão (auto)

## Decisões e ressalvas desta etapa
- Proteção de conta é persistida em `usuarios.protected_super_admin` (não por
  nome). Bootstrap por username (`samuel`/`luan`) em crm.sql + provisionamento.
  Se os usernames reais forem outros, ajustar o `update ... where lower(username)
  in (...)` no crm.sql e a env `SUPERADMIN_USERS`.
- Exclusão de conta é LÓGICA (soft delete): preserva histórico; `verificarSenha`
  nega login; some das listas por padrão (filtro "Excluídos" mostra + Restaurar).
- Alterar login invalida efetivamente a sessão do alvo (o cookie guarda o username
  antigo → `getPerfilAtual` não encontra a linha; precisa relogar). Documentado.
- Cargos visíveis: só exibição (visivel_no_perfil). Não altera cargo/permissão.
- Auditoria: helper genérico `registrarAudit` → `audit_logs`. À prova de falha
  (não derruba a ação). Nunca grava segredos.

## Limitações
- Sem runner de testes (validação por build/typecheck).
- CropModal da foto ainda não implementado.
- Enforcement de Financeiro/clientes é da PRÓXIMA etapa (base Etapa 4).
