# Reforma: Contas, Cargos e Permissões

**LER ESTE ARQUIVO PRIMEIRO em nova sessão.** Task grande, por etapa. Marca `[x]` ao concluir + commit.

## Mapeamento já feito (não repetir análise)
- Schema RBAC completo já existe: `roles/permissions/role_permissions/user_roles/user_permission_overrides` + `audit_logs`. Não recriar.
- CRUD de conta já existe em `app/admin/usuarios-actions.ts` (criar/editar/bloquear/excluir soft-delete/restaurar/redefinir senha/alterar login). Não recriar.
- Upload de foto já é bom: crop client 512×512 (`CropModal.tsx`) + Vercel Blob. Não recriar upload.

## Etapas (ordem de execução)

- [x] **Etapa 1** (feita 2026-07-23, commit `32bdb9c`, push ok) — Dedupe backend: `exigirSuperAdmin` centralizada em `app/lib/perms-guard.ts` (retorna `{id,username}`). `roles-actions.ts`, `usuarios-actions.ts` e `recrutamento-actions.ts` importam de lá. Helper `getUsuarioAtual()` extraído em `perms-guard.ts`; `getPermsAtuais` e `getSessaoAtual` (sessao.ts) consomem. Build verde. Bônus: `npm install` corrigiu dep `resend` que faltava no node_modules local (pré-existente, não causado por nós).
- [x] **Etapa 2** (feita 2026-07-23, commit `69d5925`, push ok) — `listUsuariosGestao()` agora filtra `isNull(deletedAt)`. Defesa em profundidade: `atribuirCargo`, `definirSuperAdmin` (ativar), `definirPermissaoUsuario` (on) rejeitam conta excluída via helper `contaAtiva()`, mesmo se chamados direto sem passar pela UI. Build verde.
- [ ] **Etapa 3** — Expandir `MODULOS_PERMISSOES` (permissoes.ts) pra cobrir TODOS os módulos reais do sistema (onboardings, presets, respostas de formulário, clientes, administração de contas, cargos e permissões, etc.), não só os ~11 atuais. Seed das novas permissions no `crm.sql`.
- [ ] **Etapa 4** — UI Cargos e Permissões: estender `CargosPermissoes.tsx` pra configurar abas/páginas/ações por CARGO (hoje só dá pra dar permissão individual por usuário via matriz; falta permissão por cargo de forma bulk/clara).
- [ ] **Etapa 5** — Expandir gating em `AdminShell.tsx`: hoje só 2/15 itens têm `perm`. Mapear todos os itens de menu pros módulos do catálogo.
- [ ] **Etapa 6** — Proteção de backend real: adicionar `exigirPermissao(...)` nas server actions que hoje só checam login (`crm-actions.ts`, `calendario-actions.ts`, `ponto-actions.ts`, `demandas-aprovacao-actions.ts`, `integracoes-actions.ts`, `trafego-actions.ts`, `actions.ts`).
- [ ] **Etapa 7** — Bloqueio de rota real (não só client/menu): avaliar middleware ou layout guard por permissão, não só sessão válida.
- [ ] **Etapa 8** — Login automático `nome@boechat.com`: gerar no criarUsuario, normalizar (sem acento/espaço/maiúscula), checar unicidade, fallback `nome.sobrenome@`, permitir editar antes de salvar, validar no backend. ⚠️ login hoje é username simples, não email — checar regex `validarUsername` em usuarios-actions.ts.
- [ ] **Etapa 9** — Alterar login de Luan → `luanadm@boechat.com` e Samuel → `samueladm@boechat.com` via `alterarLoginUsuario` já existente. Cuidado: mudar formato de username pode quebrar `SUPERADMIN_USERS`/`CONTRATOS_USERS` env na Vercel — avisar usuário antes de fazer, é mudança em produção que exige coordenação com env vars.
- [ ] **Etapa 10** — Status de conta: revisar se "ativo/bloqueado" cobre pedido (ativa/inativa/suspensa/excluída) ou precisa 3º estado.
- [ ] **Etapa 11** — Auditoria: cobrir gaps (acesso negado, login/logout) se sobrar tempo.
- [ ] **Etapa 12** — Testes manuais dos 23 cenários do pedido original + build verde + push.

## Notas críticas
- Etapa 9 (mudar login de Samuel/Luan) MEXE COM PRODUÇÃO/ENV VARS na Vercel. Não fazer sem confirmar com o usuário antes, mesmo em modo automático — é ação de alto risco (pode travar login deles).
- Sempre: `git fetch origin && git rebase origin/main` antes de push (Luan pode empurrar código em paralelo).
- Build (`npm run build`) antes de cada push.
