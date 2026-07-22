# Setup na Vercel — o que falta pra tudo funcionar (Luan)

Todo o código já está no `main`. Falta só a parte de infraestrutura (banco +
1 variável). São **3 passos**. O passo 1 é o único crítico.

---

## 1. Rodar o SQL no banco (Neon) — OBRIGATÓRIO

Cria/atualiza todas as tabelas e colunas do CRM (leads, clientes, projetos,
demandas, estratégia, integrações e a **logo do cliente** do painel de Tráfego).

1. Abre o **Neon** (Vercel → projeto `boechatcompany` → Storage → o Postgres →
   **Open in Neon** → SQL Editor).
2. Copia **todo** o conteúdo de `app/lib/db/crm.sql` e cola.
3. **Run.**

> É idempotente: pode rodar quantas vezes quiser. Roda de novo mesmo se já rodou
> antes — tem colunas novas desde a última vez.

## 2. Variável de ambiente `INTEGRATIONS_SECRET` — OBRIGATÓRIO

Sem ela o sistema não salva as credenciais de Meta/Google por cliente (elas são
guardadas **criptografadas**), e o painel de Tráfego não puxa dados.

1. Vercel → `boechatcompany` → **Settings → Environment Variables**.
2. Adiciona:
   - **Name:** `INTEGRATIONS_SECRET`
   - **Value:** string longa e aleatória (32+ caracteres). Gera com:
     ```
     openssl rand -base64 48
     ```
   - **Environments:** marca **Production** e **Preview**.
3. Salva.

> ⚠️ Depois de salvar credenciais de clientes, **nunca troque essa chave** —
> os tokens ficariam ilegíveis.

## 3. Redeploy

Vercel → **Deployments** → deploy do topo → **⋯ → Redeploy**.
(Variável nova só passa a valer em deploy novo.)

---

## Já está pronto (não precisa mexer)

- **Blob store** (upload de onboarding e de logo do cliente): já conectado
  (`BLOB_READ_WRITE_TOKEN`).
- `SESSION_SECRET`, `CONTRATOS_USERS`, `DATABASE_URL`: já existem.

## Não é mais necessário

- As variáveis **globais** de Meta/Google (`META_ACCESS_TOKEN`,
  `GOOGLE_ADS_*` etc.) **não são mais usadas** pelo painel de Tráfego. Agora as
  credenciais são **por cliente**, cadastradas pela interface em
  **Clientes → (cliente) → Configurações**. Pode ignorar o arquivo antigo
  `docs/trafego-credenciais.md` para o painel novo.

---

## Depois do deploy (feito pela interface, sem env)

Para cada cliente, dentro de **Clientes → (cliente) → Configurações**:

1. **Enviar logo** do cliente (aparece no cabeçalho do relatório exportado).
2. Preencher e **Salvar** as credenciais de **Meta Ads** e/ou **Google Ads**,
   depois **Testar conexão**.

Aí é só ir em **Tráfego**, escolher o cliente e o período, e usar
**Exportar painel** para baixar o PNG do relatório.

---

### Resumo curtíssimo

1. Roda o `crm.sql` no Neon.
2. Cria a env `INTEGRATIONS_SECRET` (Production + Preview).
3. Redeploy.
