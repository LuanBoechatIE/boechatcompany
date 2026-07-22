# Tráfego — credenciais (Meta + Google Ads)

O painel em `/admin/crm/trafego` puxa os dados reais assim que estas variáveis
de ambiente estiverem setadas na Vercel (Settings → Environment Variables).
Enquanto faltarem, cada aba mostra um aviso de "não conectado" com a lista do
que falta. Nada quebra: só não aparece número real.

## Meta Ads (Facebook / Instagram)

```
META_ACCESS_TOKEN      # access token long-lived (System User de preferência)
META_AD_ACCOUNT_ID     # ID da conta de anúncios (com ou sem o prefixo act_)
```

Como obter:
1. Meta Business → Configurações do negócio → Usuários do sistema → cria um
   System User com acesso à conta de anúncios.
2. Gera um token com as permissões `ads_read` (e `business_management`).
3. O `act_id` está em Gerenciador de Anúncios → Configurações da conta.

## Google Ads

```
GOOGLE_ADS_DEVELOPER_TOKEN      # token de desenvolvedor (aprovado pelo Google)
GOOGLE_ADS_CLIENT_ID            # OAuth client id
GOOGLE_ADS_CLIENT_SECRET        # OAuth client secret
GOOGLE_ADS_REFRESH_TOKEN        # refresh token do OAuth
GOOGLE_ADS_LOGIN_CUSTOMER_ID    # ID da conta MCC/gerente (só dígitos)
GOOGLE_ADS_CUSTOMER_ID          # ID da conta do cliente a consultar (só dígitos)
```

Como obter:
1. Google Ads API Center → solicita o **developer token** (passa por aprovação,
   pode levar alguns dias).
2. Google Cloud Console → cria credenciais OAuth (client id/secret).
3. Gera o **refresh token** via OAuth playground com o escopo
   `https://www.googleapis.com/auth/adwords`.
4. `LOGIN_CUSTOMER_ID` é a conta gerente; `CUSTOMER_ID` é a conta do anunciante.

> Observação: as variáveis acima são as credenciais GLOBAIS (uma conta Meta +
> uma Google por deploy), usadas no painel geral em `/admin/crm/trafego`.

## Integrações por cliente (criptografadas)

Cada cliente pode ter suas próprias credenciais de Meta Ads e Google Ads,
configuradas na aba **Configurações** do cliente. Os tokens são guardados
**criptografados** no banco (AES-256-GCM) e nunca voltam completos pro
frontend (só a máscara dos 4 últimos caracteres).

Pra habilitar, defina na Vercel uma chave secreta de criptografia:

```
INTEGRATIONS_SECRET   # string longa e aleatória (>= 32 caracteres)
```

Sem ela, o sistema não salva credenciais por cliente (fail-closed). Nunca
troque essa chave depois de salvar integrações, senão os segredos ficam
ilegíveis.
