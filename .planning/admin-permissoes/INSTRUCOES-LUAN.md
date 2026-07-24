# Instrução para o Claude do Luan executar

Cole isto inteiro numa sessão do Claude Code, dentro do repo `boechatcompany`, com acesso à Vercel CLI e à connection string do Neon (produção).

---

Preciso que você execute 4 tarefas em sequência, na ordem exata abaixo. É uma migração de produção (banco + env vars), então pare e me avise se qualquer passo falhar, não tente "consertar sozinho" pulando pro próximo.

## Tarefa 1 — Atualizar o código local

```bash
git fetch origin && git checkout main && git pull origin main
```

Confirme que o commit mais recente é da reforma de Contas/Cargos/Permissões (mensagens tipo "feat: cargos de acesso...", "feat: proteção real de permissão...", "feat: login automático...").

## Tarefa 2 — Rodar o SQL pendente no Neon (produção)

Abra a connection string de produção do Neon (via Vercel → Storage → Postgres → "Open in Neon", ou a connection string que você já tem configurada) e rode o conteúdo INTEIRO do arquivo `app/lib/db/crm.sql` no SQL Editor.

É idempotente (`on conflict do nothing`, `create table if not exists`) — pode rodar mesmo que parte já tenha sido aplicada antes, não quebra nada.

Isso cria: 32 novas permissions (onboardings, presets, respostas de formulário, recrutamento, mapas, contratos, administração de contas), popula o cargo "membro" com o baseline de acesso que todo mundo já tinha (pra ninguém perder acesso no primeiro login depois do deploy), e o restante do schema de ponto/CRM já existente.

## Tarefa 3 — Renomear o login de Samuel e Luan (Etapa 9 da reforma)

Ainda no SQL Editor do Neon, rode:

```sql
-- Renomeia os logins de Samuel e Luan para o padrão @boechat.com.
-- Roda só se o username antigo ainda existir (idempotente, seguro rodar 2x).
update usuarios set username = 'samueladm@boechat.com' where username = 'samuel';
update usuarios set username = 'luanadm@boechat.com' where username = 'luan';

-- Registra a mudança na auditoria (mesmo padrão usado pela função alterarLoginUsuario).
insert into audit_logs (ator, afetado, acao, resultado, detalhe, antes, depois)
select 'migracao-etapa9', 'samueladm@boechat.com', 'usuario.login_alterado', 'ok', 'renomeado via migração Etapa 9', 'samuel', 'samueladm@boechat.com'
where exists (select 1 from usuarios where username = 'samueladm@boechat.com');

insert into audit_logs (ator, afetado, acao, resultado, detalhe, antes, depois)
select 'migracao-etapa9', 'luanadm@boechat.com', 'usuario.login_alterado', 'ok', 'renomeado via migração Etapa 9', 'luan', 'luanadm@boechat.com'
where exists (select 1 from usuarios where username = 'luanadm@boechat.com');

-- Confirma o resultado.
select id, username, protected_super_admin, status from usuarios where username in ('samueladm@boechat.com', 'luanadm@boechat.com');
```

A última query deve retornar 2 linhas, ambas com `protected_super_admin = true` e `status = 'ativo'`. Me mostre o resultado.

⚠️ Se a query de confirmação retornar 0 ou 1 linha, PARE — significa que o username antigo já não era `samuel`/`luan` (pode já ter sido alterado antes). Não continue pra Tarefa 4 sem confirmar comigo.

## Tarefa 4 — Atualizar as env vars na Vercel (sem expor a senha na conversa)

Isso é o passo mais delicado: as env vars `CONTRATOS_USERS` e `SUPERADMIN_USERS` precisam refletir os novos logins, mas a senha de cada um (`p` dentro do JSON) NÃO deve mudar nem aparecer na nossa conversa.

Faça assim, usando a Vercel CLI:

```bash
vercel env pull .env.vercel-temp --environment=production
```

Isso baixa as env vars de produção pra um arquivo local temporário. Depois:

1. Abra `.env.vercel-temp` (você, não eu — não me cole o conteúdo do arquivo na conversa).
2. Localize `CONTRATOS_USERS`. É um JSON tipo `[{"u":"samuel","p":"..."},{"u":"luan","p":"..."}]`.
3. Troque SÓ os valores de `"u"`: `samuel` → `samueladm@boechat.com`, `luan` → `luanadm@boechat.com`. Não toque em `"p"`.
4. Localize `SUPERADMIN_USERS`. Deve ser algo como `samuel,luan`. Troque pro valor exato: `samueladm@boechat.com,luanadm@boechat.com`.
5. Salve o arquivo.

Depois, pra cada uma das duas variáveis, rode (a CLI vai pedir o novo valor interativamente — cole o valor já editado):

```bash
vercel env rm CONTRATOS_USERS production
vercel env add CONTRATOS_USERS production
# cole o JSON editado quando pedir

vercel env rm SUPERADMIN_USERS production
vercel env add SUPERADMIN_USERS production
# cole "samueladm@boechat.com,luanadm@boechat.com" quando pedir
```

Depois, **apague o arquivo temporário** (ele tem a senha em texto puro):

```bash
rm .env.vercel-temp
```

## Tarefa 5 — Redeploy

```bash
vercel --prod
```

Aguarde o deploy terminar. Depois disso, Samuel e Luan já conseguem logar com o novo login.

## Ao terminar, me reporte:

1. Resultado da query de confirmação da Tarefa 3 (as 2 linhas).
2. Confirmação de que `vercel env rm/add` rodou sem erro pras duas variáveis.
3. URL/status do deploy da Tarefa 5.
4. Qualquer erro que tenha aparecido em qualquer passo — não tente resolver sozinho, me avise primeiro.

**Não faça mais nada além dessas 5 tarefas.** Se notar algo estranho no código (bug, sugestão de melhoria), anote mas não mexa — isso é revisado pelo Samuel depois.
