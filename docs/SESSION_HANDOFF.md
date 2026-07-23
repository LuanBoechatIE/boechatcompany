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
