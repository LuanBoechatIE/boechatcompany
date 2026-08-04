# Finalizar Boechat — o que foi feito e o que falta

**De:** Jarvis (Samuel) · **Data:** 04/08/2026
**Base:** auditoria de segurança + `site-boechat-polish-v1.md` (handoff do Luan).

Dois PRs abertos, independentes. Este documento é o mapa: o que já está pronto, o que falta, e o passo a passo pra você (Luan) finalizar o que depende de banco/produção.

- **PR #1 — Segurança:** branch `seguranca-p0-samuel`
- **PR #2 — Visual (polish):** branch `visual-polish-v1`

---

## PARTE 1 — SEGURANÇA

Nota da auditoria: **3,5/10 → ~8,7/10** com o que está nos PRs.

### ✅ Feito (PR #1, já commitado e buildado)

| Item | Sev | O que era | O que foi feito |
|---|---|---|---|
| **C1** | 🔴 | ~40 Server Actions executáveis sem login (middleware não protege action no Next) | Guarda de permissão em todas + `npm run guardas` que falha se nascer action sem guarda |
| **C3** | 🔴 | Escalada a super_admin criando conta com username reservado | Bloqueio de login reservado em `criarUsuario` e `alterarLoginUsuario` |
| **C4** | 🔴 | Bloquear/excluir funcionário não cortava a sessão viva | Filtro imediato de bloqueado/excluído + coluna `sessao_versao` revogável |
| **A2** | 🟠 | Zero cabeçalhos de segurança | Headers globais + CSP em Report-Only |
| **A4** | 🟠 | Login caía no fallback de env em erro de banco (fail-open) | Fail-closed |
| **A7** | 🟠 | Helpers exportados de `"use server"` viravam endpoint público | Movidos pra módulos próprios (+2 achados além da auditoria) |
| **M2** | 🟡 | Upload aceitava SVG (XSS) e octet-stream | SVG fora de todos; imagens explícitas |
| **M3** | 🟡 | Uploads do admin confiavam só no middleware | Exigem permissão no handler |

Já estavam fechados pelo próprio Luan antes: **C2** (SSRF do getLogoDataUrl) e **A1** (rate limit no login e formulários).

Achados novos que a auditoria não listou, já guardados: `getIntegracaoView`, `listFormulariosRecrutamento`.

### 🔧 PASSO A PASSO PRA VOCÊ (Luan) — deploy da segurança

> ⚠️ **A ORDEM IMPORTA.** O C4 lê a coluna `sessao_versao`. Se o código subir antes da coluna existir, o login trava pra todo mundo.

1. **Rodar a migração no Neon primeiro.** Console do Neon → SQL Editor → cole e rode `app/lib/db/seguranca-sessao.sql` (é idempotente). Ela adiciona `usuarios.sessao_versao`.
2. **Conferir as env vars na Vercel:** `SUPERADMIN_USERS` deve listar os logins reais dos donos (hoje o default é `samuel,luan`, que não bate com o formato `nome@boechat.com`). Ver PARTE 1 → "auditar superadmin" abaixo.
3. **Fazer o merge do PR #1** → a Vercel builda e publica.
4. **Efeito esperado no primeiro deploy:** todo mundo faz login **uma vez** de novo (os tokens antigos não têm versão). Isso é esperado, não é erro.
5. **Auditar superadmin em produção** (SQL no Neon): rodar
   ```sql
   select id, username, protected_super_admin from usuarios where protected_super_admin = true;
   ```
   Confirmar que só aparecem Luan e Samuel. Se aparecer outro, investigar (C3).

### ⏳ Falta na segurança (P1/P2) — precisa de você / banco / decisão

Nenhum destes bloqueia o deploy acima. São o próximo degrau (leva de ~8,7 pra ~9,3).

| Item | O que fazer | Por que não fiz |
|---|---|---|
| **A3** | Posse de lead nas 9 ações filhas (atividade, checklist, arquivo): resolver o `leadId` pai e passar por `semAcessoAoLead`. | Precisa de join que eu não consigo testar sem banco; os guards de permissão P0 já mitigam. Código exato abaixo. |
| **A5** | Remover `CONTRATOS_USERS`; migrar Luan e Samuel pra hash no banco. | Risco de lockout se feito errado — precisa você garantir que os dois já têm senha no banco antes de tirar a env. |
| **A6** | Tirar `garantirSuperAdmin` de `getPerfilAtual` (concessão de privilégio num GET); provisionar usuário explicitamente. | Mexer nisso pode parar de conceder superadmin aos donos. Precisa você confirmar como o superadmin é concedido hoje em prod. |
| **M1** | Trocar `xlsx@0.18.5` (CVE) por `exceljs` ou versão ≥0.20.2. | Troca de dependência que precisa testar o ImportWizard de leads. |
| **M6** | KDF com salt em `crypto.ts` (hoje é SHA-256 puro do `INTEGRATIONS_SECRET`). | Girar a chave exige recriptografar todas as integrações — precisa procedimento com você. |
| **CSP** | Promover de `Report-Only` pra enforcement depois de medir violação no console. | Precisa ver o painel rodando pra saber o que ajustar (Pusher, fontes). |
| **Uploads** | Onboarding ainda aceita `octet-stream` (bytes arbitrários públicos). Ideal: store privado + URL assinada pra currículos e material de marca. | Tirar octet-stream às cegas quebra upload de .ai/.eps do cliente. Decisão sua + config de store. |

#### Código exato do A3 (pra você colar)

Em `app/admin/crm-actions.ts`, as ações que hoje têm `exigirPermissao("leads.editar")` mas não checam posse. Padrão (exemplo `deleteAtividade`):

```ts
export async function deleteAtividade(formData: FormData) {
  await exigirPermissao("leads.editar");
  const id = Number(formData.get("id"));
  if (!id) return;
  // A3: resolve o lead pai e confere posse antes de apagar.
  const sessao = await getSessaoAtual();
  const [ativ] = await getDb().select({ leadId: leadAtividades.leadId }).from(leadAtividades).where(eq(leadAtividades.id, id)).limit(1);
  if (!ativ) return;
  const [lead] = await getDb().select({ usuarioId: leads.usuarioId }).from(leads).where(eq(leads.id, ativ.leadId)).limit(1);
  if (semAcessoAoLead(sessao, lead?.usuarioId ?? null)) return;
  await getDb().delete(leadAtividades).where(eq(leadAtividades.id, id));
  revalidatePath("/admin/crm/leads");
}
```

Aplicar o mesmo em: `toggleAtividade`, `toggleChecklistItem`, `deleteChecklistItem` (join `leadChecklist`), `addChecklistItem`/`addLeadArquivo` (já recebem `leadId`, só carregar o lead direto), `deleteLeadArquivo` (join `leadArquivos`). Em `deleteFiltro`, checar `autor === sessao.username` em vez de posse de lead.

---

## PARTE 2 — VISUAL (polish v1)

### ✅ Feito (PR #2, commitado e buildado)

- **Tokens** em `app/globals.css` (aditivo): escada de superfície `surface-0..4` + `line-soft/line/strong` (viram `bg-surface-*`/`border-line-*` no Tailwind v4), e régua de movimento `--dur-instant/quick/base/gentle` + `--ease` único.
- **Elevação invertida do kanban** (o achado que você chamou de "o mais concreto"): o card era `bg-ink` (o tom mais escuro, afundava). Agora coluna = `surface-1` (recuada), card = `surface-2` com brilho interno, card em drag = `surface-4`. Vale pro kanban de leads e o de demandas; o modal do kanban virou `surface-4`.
- **Três tiers de card (base):** `app/components/admin/ui/cardTiers.ts` com Hero/Standard/Compact. `KpiCard` ganhou prop `tier` (default Standard, em surface-2, entrada 240ms). `OperationCards` virou Compact.

### ⏳ Falta — precisa rodar `/admin` com banco pra fazer certo

Não fiz às cegas porque quebraria coisa que eu não veria na tela. Ordem do próprio handoff:

1. **Fechar os tiers na tela:** escolher qual KPI vira `tier="hero"` (teto de 1 por tela) e dar a ele o span de layout maior; `StatTile` do `MetricasView` virar Compact. Teste de aceite: desatura a tela (grayscale no devtools) e a hierarquia tem que continuar óbvia.
2. **Régua de movimento** aplicada nos ~32 arquivos com `framer-motion`: entrada de card 240ms (hoje 400ms), hover 180ms, stagger com teto de 6, saída sempre mais rápida que entrada, nada com overshoot, respeitar `prefers-reduced-motion`. Usar os tokens `--dur-*`/`--ease` que já estão no globals.css. (KpiCard já foi ajustado como exemplo.)
3. **Sete gráficos:** uma série = uma cor, ordenação por valor, tooltip compartilhado, grid tracejado só na mediana, endpoint com halo. Arquivos: `ComparativoCharts` (o caso mais claro — 7 cores pra mesma métrica), `RevenueChart`, `RecurringVsSetupChart`, `ServiceDonutChart`, `MetricasView`, `MinhaMeta`, sparkline do `KpiCard`.

Detalhe completo em `docs/polish-v1-status.md` (na branch visual) e na spec original `site-boechat-polish-v1.md`.

### Como rodar local pra continuar o visual

```bash
cd _external/boechatcompany   # ou site-boechat no seu ambiente
npm install
npm run dev                   # http://localhost:3000
```

Precisa do `.env.local` com `DATABASE_URL` (Neon) pra o `/admin` carregar dados. Sem ela as telas sobem mas mostram o aviso de setup — e o visual dos cards/gráficos não dá pra conferir.

Roteiro de conferência antes de subir (seção 8 do polish-v1): grayscale mostra hierarquia? kanban sobe em vez de afundar? drag reposiciona ou teleporta? modal anima? gráficos cor única? sidebar parada na troca de página? reduced-motion não quebra? `npm run build` passa?

---

## RESUMO DE 1 LINHA

Segurança das 4 críticas + 5 altas/médias está pronta no PR #1 (rode a migração antes do deploy). O visual tem os tokens e a correção-chave do kanban no PR #2; o resto (card tiers, movimento, gráficos) precisa de você rodando local pra fechar com revisão de tela.
