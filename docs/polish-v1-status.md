# Polish v1 — status da execução

Base: `site-boechat-polish-v1.md` (handoff do Luan, 04/08/2026). Branch `visual-polish-v1`.

## Feito nesta branch (sem render, só o que é seguro às cegas)

- **Passo 1 — Tokens** (`app/globals.css`, aditivo):
  - Escada de superfície `--color-surface-0..4` + `--color-line-soft/line/line-strong` (viram `bg-surface-*` e `border-line-*` no Tailwind v4).
  - Régua de movimento `--dur-instant/quick/base/gentle` + `--ease` (cubic-bezier .22,1,.36,1).
- **Passo 2 (parcial) — Elevação invertida do kanban** (o achado que o Luan chama de "o mais concreto"):
  - `app/admin/crm/leads/LeadCard.tsx`: card sai de `bg-ink` (afundava) pra `bg-surface-2` + brilho interno; em drag vai pra `bg-surface-4`.
  - `app/admin/crm/leads/LeadsBoard.tsx`: coluna desce pra `bg-surface-1`; over clareia pra `surface-2`.
  - `app/components/admin/kanban/KanbanBoard.tsx` (demandas): mesma correção no card e coluna; modal vira `bg-surface-4` (superfície flutuante).

## Pendente — precisa rodar com render (`/admin` com banco) pra fazer certo

Não fiz às cegas porque quebraria coisa que eu não veria na tela:

- **Passo 2 (resto) — Três tiers de card** (`app/components/admin/ui/`): componentes Hero/Standard/Compact envolvendo o que existe; `KpiCard` ganha prop `tier`; `OperationCards` e `StatTile` viram Compact. Precisa ver a hierarquia na tela (teste do grayscale).
- **Passo 3 — Régua de movimento** aplicada nos ~32 arquivos com `framer-motion` (entradas 240ms, hover 180ms, stagger teto 6, saída sempre mais rápida, sem overshoot, respeitar reduced-motion). É onde mais se erra sem ver rodando.
- **Passo 4 — Gráficos** (7 componentes): uma série/uma cor, ordenação por valor, tooltip compartilhado, grid tracejado só na mediana, endpoint com halo. `ComparativoCharts`, `RevenueChart`, `RecurringVsSetupChart`, `ServiceDonutChart`, `MetricasView`, `MinhaMeta`, sparkline do `KpiCard`.

## Como continuar

1. `cd _external/boechatcompany && npm run dev` com `DATABASE_URL` de dev no `.env.local`.
2. Seguir a ordem 1→4 do handoff; cada passo já melhora a tela sozinho.
3. Roteiro de conferência (grayscale, kanban sobe/afunda, drag reposiciona, modal anima, gráficos cor única, sidebar parada, reduced-motion) na seção 8 do `site-boechat-polish-v1.md`.
