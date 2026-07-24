# RBAC Fase 2 — Cargos, Menu Dinâmico, Dashboard Modular

**LER ESTE ARQUIVO PRIMEIRO em nova sessão sobre este pedido.** Continuação do trabalho em `PROGRESS.md` (fase 1, quase toda concluída). Esta fase 2 é o pedido maior: RBAC completo estilo HubSpot/ClickUp/Monday, menu dinâmico, dashboard modular por cargo, presets protegidos na UI, painel único de administração de conta, configs por cargo, metas com trava de edição.

**Última atualização:** 2026-07-24

## Etapa atual
Etapa 2 (menu dinâmico) — em andamento.

## Mapeamento (Etapa 1 — concluída 2026-07-24, sem código)

Infra RBAC real já é sólida, não recriar:
- `app/lib/perms-guard.ts` — `temPermissao/exigirPermissao/exigirSuperAdmin/getPermsAtuais`.
- `app/lib/permissoes.ts` — catálogo `MODULOS_PERMISSOES` (já cobre administracao_contas, presets, onboardings, recrutamento, mapas, contratos, leads, etc).
- Schema: `roles/permissions/role_permissions/user_roles/user_permission_overrides` + `audit_logs`. `cargos`/`userCargos` é **intencionalmente separado** (rótulo cosmético, documentado em `schema.ts:527-529`) de `roles` (acesso real). **Não fundir as duas tabelas.**
- `app/admin/roles-actions.ts` + `app/admin/configuracoes/CargosPermissoes.tsx` — CRUD de "cargos de acesso" (roles) + matriz de permissão, UI já pronta e reaproveitável.
- `app/admin/CopyLink.tsx` — botão copiar link, já existe.

Gaps identificados (o que falta, por tópico do pedido do usuário):

1. **Menu (`AdminShell.tsx`)**: filtra item a item mas nunca esconde grupo/categoria vazia. `NAV_GROUPS`: Gestão, Equipe, Onboarding, Comercial.
2. **Dashboard**: dois dashboards — `/admin/crm/page.tsx` (executivo, KPIs financeiros/operação/alertas, só financeiro é condicional) e `/admin/page.tsx` (onboardings). Nenhum é modular por cargo. Componentes prontos pra reaproveitar sem duplicar lógica: `app/admin/crm/leads/MinhaMeta.tsx`, `MetricasView.tsx`, `MinhaFilaView.tsx` (dados vêm de `getLeadsData()` em `app/lib/crm/leads-data.ts`).
3. **Cargos existentes**: tabela `cargos` (cosmética) só tem 8 seeds (Administrador, Gestor de Tráfego, Designer, Social Media, Comercial, Atendimento, Financeiro, Gestor de Projetos). Tabela `roles` (RBAC real) só tem 3 (`super_admin`, `membro`, `diretor_comercial`). **SDR, BDR, Copywriter, CEO, COO não existem em lugar nenhum** — precisam ser criados como roles + cargos cosméticos com permissões coerentes.
4. **Presets** (`app/admin/presets/page.tsx`, `PresetEditor.tsx`): back-end já protege criar/editar/excluir via `exigirPermissao("presets.*")`. **UI não esconde os botões** — quem só tem `presets.visualizar` ainda vê Editar/Excluir/Novo Preset (falha só ao clicar). Falta condicionar a UI + adicionar affordance de "Copiar Link" no lugar dos removidos.
5. **Administração de contas** (`app/admin/configuracoes/AdminContas.tsx` + `usuarios-actions.ts`): painel fragmentado em modais separados (editar nome/email, login, senha) + aba separada pra cargo/permissões (`CargosPermissoes.tsx`). Falta painel único por funcionário. Além disso `usuarios-actions.ts` usa `exigirSuperAdmin()` em **todas** as ações (criar/editar/bloquear/resetar senha/excluir/restaurar/alterar login), ignorando as permissões granulares `administracao_contas.*` já semeadas em `crm.sql:648-653` (existem no catálogo mas não são checadas em nenhuma action real). `ConfiguracoesTabs.tsx:59` só mostra as abas de contas/cargos se `perfil.superAdmin` (hardcoded), não por permissão.
6. **Metas** (`metas_prospeccao`, `MinhaMeta.tsx`, `setMetas()` em `crm-actions.ts:950`): **zero trava hoje** — qualquer logado edita a própria meta livremente, `setMetas` só checa login. Falta permissão `metas.editar` (só CEO/COO/Super Admin/admin autorizado) vs `metas.visualizar` (todo mundo).
7. **Módulos SDR**: todos os módulos pedidos (Dashboard, Leads, Demandas, Calendário, Mapas Mentais, Onboards, Presets) já têm rota própria e guard de página via `temPermissao`. Remover Clientes/Projetos/Estratégia/Tráfego/Equipes do cargo SDR é, portanto, apenas questão de **não conceder essas permissões ao role SDR** (a arquitetura já suporta, não precisa mexer em código de página).

## Decisões arquiteturais
- Não fundir `cargos` (cosmético) com `roles` (RBAC). Criar novos cargos profissionais (SDR, BDR, CEO, COO, etc.) tanto como `roles` (acesso) quanto como `cargos` (rótulo exibido), usando a UI já existente — sem SQL manual quando possível, senão documentar bloco pendente pro Neon como a fase 1 já fazia.
- Menu: grupo só renderiza se `grupo.itens.filter(item visível).length > 0`.
- Dashboard: extrair definição de "widgets por permissão" centralizada (ex. `dashboard-widgets.ts` mapeando `perm → widget`), não `if (cargo === "SDR")` espalhado — alinhado ao pedido explícito do usuário de evitar condicionais por cargo.
- Metas: nova permissão `metas.editar`; CEO/COO/Super Admin sempre têm (via `exigirSuperAdmin` bypass já existente ou permissão concedida). Demais cargos só visualizam.
- Contas: trocar `exigirSuperAdmin()` por `exigirPermissao("administracao_contas.<acao>")` nas actions, sabendo que super admin já passa em qualquer `exigirPermissao` (confirmar isso no código de `perms-guard.ts` antes de trocar, pra não quebrar acesso do CEO/COO/Super Admin).

## Etapas (ordem do pedido do usuário)

- [x] **Etapa 1** — Análise completa da arquitetura (concluída acima, sem código).
- [ ] **Etapa 2** — Camada centralizada de permissões (já existe, só endurecer onde falta) + menu lateral 100% dinâmico (esconder categoria vazia).
- [ ] **Etapa 3** — Dashboard modular por cargo (SDR: saudação/data/novo lead/novo cliente/novo projeto/meu ponto + Metas do Dia + Métricas + Minhas Filas reaproveitados de Leads; remover widgets fixos genéricos pra quem não deveria ver).
- [ ] **Etapa 4** — Criar roles/cargos iniciais (SDR, BDR, Atendimento, Social Media, Designer, Gestor de Tráfego, Financeiro, Comercial, Copywriter, CEO, COO, Administrador, Super Admin) com permissões coerentes semeadas.
- [ ] **Etapa 5** — Refatorar módulos (presets esconder botões na UI por permissão + copiar link; demais módulos já ok, validar caso a caso).
- [ ] **Etapa 6** — Painel único de administração de conta por funcionário + configs específicas por cargo (metas de ligações/reuniões/etc conforme cargo) + gate de metas (`metas.editar` só CEO/COO/Super Admin/autorizados).
- [ ] **Etapa 7** — Revisão completa, build, testes manuais, checklist final.

## Notas críticas
- Sempre `git fetch origin && git rebase origin/main` antes de push (Luan pode empurrar em paralelo).
- Build (`npm run build`) antes de cada push.
- `crm.sql` costuma acumular blocos pendentes de rodar manualmente no Neon (produção) — se esta fase adicionar permissions/roles novas, documentar bloco pendente como a fase 1 fez.
- Alta atenção pra não regredir acesso de CEO/COO/Super Admin — devem continuar irrestritos em qualquer refatoração de guard.
