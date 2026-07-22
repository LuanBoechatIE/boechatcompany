# Google Agenda — configuração (Fase 1)

A integração já está implementada no código. Para funcionar em produção, falta a
configuração externa no **Google Cloud Console** (feita uma vez pelo admin) e as
variáveis de ambiente na Vercel. Nenhuma senha do Gmail é usada — só o fluxo
oficial OAuth 2.0.

## 1. Variáveis de ambiente (Vercel → Settings → Environment Variables)

```
GOOGLE_CLIENT_ID=            # do cliente OAuth (passo 3)
GOOGLE_CLIENT_SECRET=        # do cliente OAuth (passo 3)
GOOGLE_REDIRECT_URI=https://www.boechatcompany.com.br/admin/api/google/oauth/callback
```

> Os **tokens** (access/refresh) são criptografados com a mesma chave já usada nas
> integrações de anúncios: `INTEGRATIONS_SECRET`. Não é preciso uma
> `GOOGLE_TOKEN_ENCRYPTION_KEY` separada (adaptado à convenção do projeto).

Marque **Production** e **Preview**. Faça **Redeploy** depois.

## 2. Ativar a Google Calendar API

1. https://console.cloud.google.com → crie/escolha um projeto (ex.: "Boechat").
2. **APIs e serviços → Biblioteca** → busque **Google Calendar API** → **Ativar**.

## 3. Criar as credenciais OAuth (aplicação web)

1. **APIs e serviços → Credenciais → Criar credenciais → ID do cliente OAuth**.
2. Tipo: **Aplicativo da Web**.
3. **URIs de redirecionamento autorizados** → adicione exatamente:
   ```
   https://www.boechatcompany.com.br/admin/api/google/oauth/callback
   ```
   (e, se for testar em preview/local, adicione também a URL equivalente do preview.)
4. Salve e copie **Client ID** e **Client Secret** → cole nas env vars do passo 1.

## 4. Tela de consentimento (OAuth consent screen)

1. **APIs e serviços → Tela de permissão OAuth**.
2. Tipo de usuário: **Externo**.
3. Preencha nome do app ("Boechat"), e-mail de suporte e e-mail do desenvolvedor.
4. **Escopos** usados pela integração (permissões mínimas):
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `openid`, `userinfo.email`
5. Em **Usuários de teste**, adicione **boechatcompany@gmail.com** (e Samuel/Luan
   se forem conectar). Enquanto o app estiver em "Teste", só esses e-mails
   conseguem autorizar — o que é suficiente para uso interno da agência.

## 5. Conectar a conta boechatcompany@gmail.com

1. Faça login no admin do site (`/admin`).
2. Vá em **Calendário**.
3. No painel do topo, clique em **Conectar Google Agenda**.
4. Você será levado ao Google. **Faça login com boechatcompany@gmail.com** e
   autorize as permissões.
5. Voltará para o Calendário já conectado; a primeira sincronização roda sozinha.

> É aqui que a conta é autorizada — sem senha no sistema, só o botão + login no
> próprio Google.

## 6. Como testar

- **Criar evento:** Calendário → "Novo evento" (ou clique num dia) → tipo "Evento".
- **Reunião + Meet:** tipo "Reunião" (Meet já vem marcado) → adicione convidados
  (chips Samuel/Luan ou e-mail manual) → Criar. O link do Meet aparece no detalhe.
- **Convites:** os convidados recebem o e-mail do Google (sendUpdates=all).
- **Google → Boechat:** crie um evento direto no Google Agenda da conta e clique
  em **Sincronizar agora** — ele aparece no calendário interno.
- **Boechat → Google:** o evento criado no sistema aparece no Google Agenda.

## Permissões OAuth solicitadas

Ver/criar/editar/excluir eventos, gerenciar convidados e criar Google Meet
(escopo `calendar.events`), mais leitura (`calendar.readonly`) e o e-mail da conta.

## Limitações desta fase (próximas fases)

- **Fase 1 (feita):** OAuth, tokens criptografados, criar/excluir eventos + Meet +
  convidados, visões Mês e Agenda, demandas/tarefas/prazos no calendário,
  sincronização manual (botão) e ao carregar/conectar, incremental por syncToken.
- **Fase 2:** visões Semana/Dia com horários e arrastar/redimensionar.
- **Fase 3:** webhook push do Google (`/watch`) com renovação de canal — precisa de
  URL HTTPS pública; hoje a sincronização é manual/ao abrir a página.
- **Fase 4:** escopos de edição/exclusão de eventos recorrentes (só este / e
  seguintes / todos) e resolução de conflitos com UI.

Pendências que dependem de configuração externa: passos 2–5 acima (Google Cloud).
