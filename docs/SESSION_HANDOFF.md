# SESSION HANDOFF

Última atualização: 2026-07-23 (sessão autônoma noturna).

## Etapa atual: AJUSTES DE CONTAS, PERFIL E CONFIGURAÇÕES

### Concluído nesta sessão
- **DB:** `usuarios.protected_super_admin`, `deleted_at`, `deleted_by`, `deletion_reason`;
  `user_cargos.visivel_no_perfil`, `ordem`; tabela `audit_logs`; permissões
  `usuarios.excluir`, `users.login.update`; bootstrap `protected_super_admin=true`
  para `samuel`/`luan`. (schema.ts + crm.sql, idempotente).
- **Proteção Samuel/Luan (backend):** não podem ser bloqueados, excluídos, nem
  perder superadmin — validado em `usuarios-actions.ts` e `roles-actions.ts`.
  Tentativas bloqueadas são auditadas.
- **Exclusão de conta comum:** soft delete (`excluirUsuario`) com confirmação do
  login + motivo; `restaurarUsuario`; `verificarSenha` nega conta excluída.
- **Alterar login:** `alterarLoginUsuario` (só superadmin); único/validado; audita.
- **Cargos visíveis:** `definirCargosVisiveis` (próprio usuário); `perfil.cargos`
  agora tem `id`+`visivel`; sidebar mostra só visíveis; toggle verde/cinza em
  Meu Perfil.
- **UI:** AdminContas (excluir/restaurar/login, esconde ações p/ protegidos,
  badges Protegida/Excluída, filtro Excluídos); CargosPermissoes (chip "Conta
  protegida" no lugar de remover-super); scrollbar roxa global.
- **Auditoria:** helper `app/lib/audit.ts` (`registrarAudit`) + `listAuditLogs`.

### PENDENTE nesta etapa (fazer a seguir)
1. **Enquadramento/crop da foto de perfil** — NÃO feito.
   Próxima ação: criar `app/admin/configuracoes/CropModal.tsx` (canvas, pan+zoom,
   preview circular, exporta quadrado via canvas.toBlob → upload em
   `/admin/api/upload-logo`). Integrar no `enviarFoto` de `MeuPerfil`.
2. **Barra sem função em Configurações** — aplicado `main{overflow-x:clip}` e
   scrollbar roxa; falta confirmação visual do elemento exato (precisa navegador).
3. **UI de logs de auditoria** — `listAuditLogs` existe no backend; falta uma
   aba/seção pra exibir (opcional; superadmin).
4. **Testes via API** — projeto NÃO tem runner de testes; validação por
   build+typecheck. Registrado em TEST_RESULTS.md.

## FILA GLOBAL (do usuário, em ordem)
Depois desta etapa, seguir com a **base da Etapa 4** (não implementada):
1. Proteção do **Financeiro** por permissão (`finance.view`) no backend (rotas/dados).
2. Proteção da **exclusão de clientes** (`clients.delete`).
3. **Matriz de permissões por usuário** (conceder permissões pontuais sem superadmin).
4. Ponto/horas (`work_shifts`), times/equipes, ranking de produção, "Meu desempenho",
   gráfico de horas, painel "Equipe agora", reestruturação do Dashboard.
5. Logs de auditoria (UI) / Etapa 5.
Depois: Calendário Fases 2-4.

## Migration / deploy
- **Rodar `app/lib/db/crm.sql` no Neon** (idempotente) para aplicar as colunas novas.
- Sem novas variáveis de ambiente.
- Mudanças de UI valem após o próximo deploy (Vercel).

## Próximo comando recomendado
`npm run build` (verificar verde) -> commit -> seguir com CropModal, depois base Etapa 4.

---
## Atualização (base Etapa 4 — segurança Financeiro/Clientes)

### Concluído
- `app/lib/perms-guard.ts`: `getPermsAtuais`/`temPermissao`/`exigirPermissao`.
- **Financeiro protegido no backend:**
  - `financeiro-actions.ts`: as 9 mutations exigem `financeiro.editar`.
  - `crm/financeiro/page.tsx`: exige `financeiro.visualizar` (senão SemPermissao).
  - `crm/page.tsx` (dashboard): KPIs em R$ + gráficos de receita só com `financeiro.visualizar`.
  - `clientes/[id]/page.tsx`: card MRR + bloco contratos/pagamentos só com permissão.
- **Exclusão de clientes protegida:**
  - `deleteCrmCliente`: exige `clientes.excluir` + confirmação de nome + auditoria.
  - Botão de excluir escondido na lista e na ficha sem a permissão.
- **Sidebar:** item Financeiro volta a aparecer, condicionado a `financeiro.visualizar`
  (via `perm` no NavItem + filtro no render).
- `SemPermissao.tsx`: aviso de acesso restrito reutilizável.

### PENDENTE (próximas etapas — NÃO feitas)
- **Matriz de permissões por usuário** (conceder finance/clients/demandas.* a não-super):
  a tabela `user_permission_overrides` e o resolvedor já existem; falta a UI.
  SEM ela, hoje só superadmin tem finance/clients; funcionário comum fica sem —
  o que é seguro, mas ainda não dá pra liberar acesso pontual.
- Ponto/horas, times, ranking, "Meu desempenho", "Equipe agora", dashboard restruturado.
- CropModal já feito; barra "sem função" das Configurações precisa de confirmação visual.
- Calendário Fases 2-4.

### Migration
- Rodar `app/lib/db/crm.sql` no Neon (idempotente) — necessário para as colunas/
  permissões desta e da etapa anterior.
