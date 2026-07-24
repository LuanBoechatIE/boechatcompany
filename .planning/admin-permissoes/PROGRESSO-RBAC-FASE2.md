# RBAC Fase 2 — Cargos, Menu Dinâmico, Dashboard Modular

**LER ESTE ARQUIVO PRIMEIRO em nova sessão sobre este pedido.** Continuação do trabalho em `PROGRESS.md` (fase 1, quase toda concluída). Esta fase 2 é o pedido maior: RBAC completo estilo HubSpot/ClickUp/Monday, menu dinâmico, dashboard modular por cargo, presets protegidos na UI, painel único de administração de conta, configs por cargo, metas com trava de edição.

**Última atualização:** 2026-07-24

## Etapa atual
**Todas as 7 etapas concluídas nesta sessão (2026-07-24).** Todos os commits estão pushados pro `main` (`aab47bf`…`74a455f`). Build (`npm run build`) verde após cada etapa.

## Etapa 7 — revisão final (2026-07-24)
- Build completo (`npm run build`) verde na versão final de todos os arquivos.
- Grep de sanidade: nenhuma referência sobrando a `EditarModal`/`LoginModal`/`ResetModal` (removidos na Etapa 6).
- Todas as chaves de permissão usadas nos seeds de roles (Etapa 4) conferidas contra o catálogo (nenhum typo).
- Acesso de CEO/COO/Super Admin preservado em toda refatoração: `sup=true` bypassa `temPermissao`/`exigirPermissao` em qualquer checagem nova.
- **Gap conhecido, não implementado nesta sessão**: "Configurações específicas por cargo" no sentido amplo do pedido original (ex.: meta de campanhas/otimizações pro Gestor de Tráfego, meta de conteúdos/postagens/aprovações pro Social Media) exigiria uma tabela nova de configuração genérica por cargo (schema novo) — escopo de trabalho maior, não iniciado. O que já cobre parcialmente: Metas de prospecção (ligações/reuniões/etc, por usuário, diária) já tem trava de edição (Etapa 6).

## ⚠️ Pendências manuais (rodar no SQL Editor do Neon, em produção)
`app/lib/db/crm.sql` acumulou 3 blocos novos nesta sessão que só existem localmente até rodar manualmente:
1. Etapa 3 — permissão `dashboard.kpis_executivos` + grant pro role `membro`.
2. Etapa 4 — 12 roles novas (`ceo`, `coo`, `sdr`, `bdr`, `atendimento`, `social_media`, `designer`, `gestor_trafego`, `financeiro`, `comercial`, `copywriter`, `administrador`) + 5 cargos cosméticos (SDR, BDR, CEO, COO, Copywriter) + suas permissões.
3. Etapa 6 — permissões `metas.visualizar`/`metas.editar` + grant de `metas.visualizar` pro `membro`.

**Recomendação**: copiar o `crm.sql` completo (é idempotente, todo `on conflict do nothing`) e rodar no Neon de uma vez — não precisa isolar só os blocos novos.

## Checklist do pedido original (o que foi feito x o que falta)
- [x] RBAC centralizado (cargo → permissões → interface → ações), sem `if (cargo === "SDR")` espalhado.
- [x] Menu 100% dinâmico, categoria vazia some sozinha.
- [x] Dashboard modular por permissão (SDR: saudação/data/novo lead/cliente/projeto/meu ponto + Metas do Dia/Métricas/Minhas Filas; KPIs executivos atrás de permissão).
- [x] Cargos iniciais criados com permissões coerentes pra SDR/BDR/Atendimento/Social Media/Designer/Gestor de Tráfego/Financeiro/Comercial/Copywriter/CEO/COO/Administrador.
- [x] Presets protegidos (copiar link pra quem só visualiza; editar/excluir/novo só com permissão).
- [x] Segurança: ações destrutivas exigem permissão explícita; dúvida = bloqueado (login/senha continuam superadmin-only).
- [x] CEO/COO/Super Admin com acesso total e irrestrito, preservado em toda a refatoração.
- [x] Administração de contas: painel único por funcionário (nome/cargo/e-mail/login/status/senha com mostrar-ocultar/alteração de cargo/permissões).
- [x] Metas: só CEO/COO/Super Admin/administrador editam; demais só visualizam.
- [ ] Configurações específicas por cargo além de metas de prospecção (campanhas, conteúdo, etc.) — gap documentado acima, fase futura.
- [ ] Rodar `crm.sql` no Neon (pendência manual, não executável a partir daqui).

## Etapa 6, parte 2 — painel único de administração de conta (2026-07-24, build verde, commitado)
- Novo `app/admin/configuracoes/FuncionarioPainel.tsx`: modal único aberto ao clicar na linha do funcionário em `AdminContas.tsx`, com abas "Conta" (nome, e-mail, status, cargos cosméticos, e pra superadmin: login e redefinir senha com mostrar/ocultar) e "Cargo & Permissões" (só superadmin — cargos de acesso via `atribuirRoleUsuario/removerRoleUsuario` + matriz de permissões individuais via `getMatrizPermissoes/definirPermissaoUsuario`, todos já existentes em `roles-actions.ts`, sem duplicar lógica de backend).
- `AdminContas.tsx`: removidos `EditarModal`/`LoginModal`/`ResetModal` (consolidados no painel único). Botões de ação (Novo usuário/Bloquear/Excluir/Restaurar) agora condicionados a `administracao_contas.criar_conta/editar_conta/excluir_conta` — gap real corrigido (antes, quem tivesse só `administracao_contas.visualizar` via a aba mas via TODOS os botões, mesmo sem a permissão granular; a action falhava só ao clicar).
- Gap conhecido, não implementado nesta sessão: "Configurações específicas por cargo" no sentido amplo do pedido (ex.: meta de campanhas/otimizações pro Gestor de Tráfego, meta de conteúdos/postagens/aprovações pro Social Media) — isso exigiria uma tabela nova de configuração genérica por cargo (schema novo), que é um recorte de trabalho maior e não foi iniciado. O que já existe e cobre parcialmente o pedido: Metas de prospecção (ligações/atendidas/decisores/reuniões/whatsapps/followups) já são por usuário, diária, e agora só CEO/COO/Super Admin/administrador podem editar (Etapa 6 parte 1).

## Etapa 6, parte 1 — gate de metas (2026-07-24, build verde, commitado)
- Novo módulo `metas` no catálogo (`metas.visualizar`, `metas.editar`) + seed em `crm.sql` (visualizar vai pro baseline "membro" como os outros módulos; editar NÃO vai pro baseline — é a restrição nova pedida).
- `setMetas()` em `crm-actions.ts` agora exige `metas.editar` (antes só checava login — qualquer um editava a própria meta livremente).
- `MinhaMeta.tsx` ganhou prop `podeEditar` (default `false`, lado restritivo): esconde o botão "Editar metas" e o formulário de edição quando ausente. Threading da permissão: `leads/page.tsx` → `LeadsWorkspace` (prop `podeEditarMetas`) e `crm/page.tsx` → `DashboardLeadsWidgets` (mesma prop), ambos calculando `temPermissao("metas.editar")` no server.
- CEO/COO/Super Admin continuam podendo editar via bypass automático de `sup=true`; role `administrador` (Etapa 4) já tinha `metas.editar` no seed.

## Etapa 5 (2026-07-24, build verde, commitado)
- `app/admin/presets/page.tsx`: "Criar presets padrão" atrás de `presets.gerenciar`, "Novo preset" atrás de `presets.criar`, "Editar"/"Excluir" por item atrás de `presets.editar`/`presets.excluir`. Novo `<CopyLink token={id} basePath="/admin/presets" compact />` sempre visível pra quem só visualiza (reaproveita o componente já existente, sem duplicar).
- Gap real encontrado e corrigido: `app/admin/presets/novo/page.tsx` e `app/admin/presets/[id]/page.tsx` **não tinham nenhum guard de página** (só a action server-side barrava o submit) — quem tivesse a URL via qualquer permissão de presets conseguia abrir os formulários de criar/editar. Adicionado `temPermissao("presets.criar"|"presets.editar")` + `<SemPermissao/>` nas duas.

## Etapa 4 (2026-07-24, commit `1ff3f27`, push ok)
Seed em `crm.sql`: 12 roles novas (`ceo`, `coo` com `sup=true` = acesso total idêntico a super_admin, inclusive permissões futuras; `sdr`, `bdr`, `atendimento`, `social_media`, `designer`, `gestor_trafego`, `financeiro`, `comercial`, `copywriter`, `administrador` com permissões coerentes granuladas) + 5 cargos cosméticos novos (SDR, BDR, CEO, COO, Copywriter — os demais 8 já existiam). `administrador` recebe gestão operacional ampla mas SEM `administracao_contas.excluir_conta/alterar_cargos/gerenciar_permissoes` (reservado a CEO/COO/Super Admin, evita escalonamento de privilégio). Todas as chaves de permissão usadas foram conferidas contra o catálogo já semeado (nenhuma nova, exceto `dashboard.kpis_executivos` da Etapa 3). ⚠️ **PENDENTE MANUAL**: rodar este bloco no Neon. Depois de rodado, super admin pode ajustar cada role livremente pela UI "Cargos de acesso" sem precisar de SQL.

## Feito nesta sessão (2026-07-24)
- **Etapa 2** (commit `aab47bf`, push ok): `AdminShell.tsx` esconde grupo do menu inteiro quando nenhum item filho é visível (`itensVisiveis.length === 0 → return null`). `perms-guard.ts` ganhou `exigirPermissaoAtor(perm)` (como `exigirPermissao` mas retorna `{id,username}` do ator). `usuarios-actions.ts`: `criarUsuario/editarUsuario/definirStatusUsuario/excluirUsuario/restaurarUsuario/listUsuariosAdmin` passam a checar `administracao_contas.*` em vez de `exigirSuperAdmin()` binário; `redefinirSenhaUsuario`/`alterarLoginUsuario` continuam superadmin-only (mais sensíveis, sem chave dedicada, "prefira bloquear"). `ConfiguracoesTabs.tsx`: aba "Administração de contas" segue `administracao_contas.visualizar`; aba "Cargos e permissões" continua superadmin-only de propósito (evita escalonamento de privilégio, já que `roles-actions.ts` também é 100% superadmin).
- **Etapa 3** (build verde, ainda não commitada nem pushada nesta mensagem — ver próximo passo): dashboard `/admin/crm/page.tsx` ficou modular:
  - Nova permissão `dashboard.kpis_executivos` (catálogo em `permissoes.ts` + seed em `crm.sql`, com grant automático pro role `membro` pra preservar quem já via os KPIs).
  - Bloco de KPIs/gráficos/operação/alertas/atividade (antes fixo pra todo mundo, exceto valores em R$) agora só renderiza se `dashboard.kpis_executivos`.
  - Novo componente `app/admin/crm/DashboardLeadsWidgets.tsx` (client) reaproveitando `MinhaMeta`/`MetricasView`/`MinhaFilaView` de `app/admin/crm/leads/` sem duplicar lógica — aparece logo abaixo do `MeuPontoCard` pra quem tem `leads.visualizar` (escopo: próprio vendedor, ou toda equipe se `sessao.podeVerEquipe`).
  - `DashboardHeader` ganhou props opcionais `podeNovoLead/podeNovoCliente/podeNovoProjeto` (default `true`, não quebra quem não passar as props); a página `/admin/crm` passa esses valores calculados por `leads.criar/clientes.criar/projetos.criar`.
  - ⚠️ **PENDENTE MANUAL**: rodar o bloco novo de `crm.sql` (permission `dashboard.kpis_executivos` + grant pro `membro`) no SQL Editor do Neon.

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
- [x] **Etapa 2** (commit `aab47bf`, push ok) — Camada centralizada de permissões endurecida (contas usam permissão granular) + menu lateral 100% dinâmico (esconder categoria vazia).
- [x] **Etapa 3** (build verde, commitado) — Dashboard modular por cargo (SDR: saudação/data/novo lead/novo cliente/novo projeto/meu ponto + Metas do Dia + Métricas + Minhas Filas reaproveitados de Leads; widgets executivos fixos agora atrás de `dashboard.kpis_executivos`).
- [x] **Etapa 4** (build n/a — SQL puro, commit `1ff3f27`) — Criar roles/cargos iniciais (SDR, BDR, Atendimento, Social Media, Designer, Gestor de Tráfego, Financeiro, Comercial, Copywriter, CEO, COO, Administrador; Super Admin já existia) com permissões coerentes semeadas em `crm.sql`.
- [x] **Etapa 5** (build verde, commitado) — Presets: botões condicionados a permissão + Copiar Link; corrigido gap de páginas sem guard (`novo`/`[id]`).
- [x] **Etapa 6** (build verde, commitado) — Gate de metas (`metas.editar`) + painel único de administração de conta por funcionário. "Configs específicas por cargo" além de metas de prospecção fica como gap documentado pra fase futura (exigiria schema novo).
- [ ] **Etapa 7** — Revisão completa, build, testes manuais, checklist final.

## Notas críticas
- Sempre `git fetch origin && git rebase origin/main` antes de push (Luan pode empurrar em paralelo).
- Build (`npm run build`) antes de cada push.
- `crm.sql` costuma acumular blocos pendentes de rodar manualmente no Neon (produção) — se esta fase adicionar permissions/roles novas, documentar bloco pendente como a fase 1 fez.
- Alta atenção pra não regredir acesso de CEO/COO/Super Admin — devem continuar irrestritos em qualquer refatoração de guard.
