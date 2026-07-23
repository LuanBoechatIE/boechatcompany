# Resultados de testes

O projeto NÃO possui runner de testes (sem jest/vitest/playwright configurado).
A verificação oficial do projeto é `npm run build` (compila + type-check).

## Regras de permissão validadas por revisão de código (backend)
Todas as ações sensíveis validam sessão + permissão no servidor (não confiam no
front). Guardas presentes em `usuarios-actions.ts` / `roles-actions.ts`:
- bloquear/excluir/remover-super de conta protegida → recusado + auditado.
- excluir superadmin ou a si mesmo → recusado.
- exclusão exige digitar o login.
- alterar login → só superadmin; unicidade validada.
- último superadmin ativo não pode ser bloqueado/removido.
- `verificarSenha` nega login de conta bloqueada ou excluída.

## Pendente
- Testes automatizados de API (requereria adicionar runner). Recomendado para a
  base da Etapa 4 (finance.view / clients.delete).

## Build/typecheck
Ver PROJECT_STATE.md para o último resultado registrado.
