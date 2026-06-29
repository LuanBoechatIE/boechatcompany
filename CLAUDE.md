@AGENTS.md

# Boechat — regras deste site (não-negociáveis)

Marca: Boechat Company. Vende RESULTADO no digital (não "site"). Tom ousado, direto, vendedor.

## Copy (proibições duras)
- ⛔ Travessão (—) na copy de marca. Use ponto, vírgula ou reescreve.
- ⛔ Palavra "premium". Use "afiado", "alto desempenho", "à altura".
- ⛔ Vender "IA" / automação / tecnologia no discurso. IA é motor interno; vende-se resultado.

## Conversão
- 1 CTA por seção (nada de botão secundário lado a lado).
- TODOS os CTAs vão pro WhatsApp via `app/lib/contato.ts` (`WA_AGENDAR` ou `whatsappLink(msg)`).
- CTA de meio de seção: componente `app/components/SectionCTA.tsx` (props `label`, `message`, `onLight` pra fundo claro).

## Cases (seção Resultados)
- Editáveis no array `cases` em `app/components/Resultados.tsx`.
- Logos transparentes em `public/cases/`.
- ⚠️ Métricas: confirmar com o dono antes. Não publicar número que ele não consiga sustentar numa reunião.

## Stack & build
Next.js 16 (Turbopack) + Tailwind + Framer Motion + Lenis. Deploy Vercel. Repo `boechatcompany`.
⚠️ O preview server NÃO roda neste ambiente (espaço em "Program Files"). Verifique com `npm run build`.

## Área interna de contratos (`/contratos`)
- Rota protegida por login (2 usuários fixos: Luan + Samuel). NÃO linkada em lugar nenhum, `noindex`.
- Auth: `middleware.ts` + `app/lib/auth.ts` (cookie HMAC, sem Supabase). Fail-closed: sem env vars, ninguém entra.
- ⚙️ Precisa de env vars na Vercel: `SESSION_SECRET` e `CONTRATOS_USERS` (ver `.env.example`). Senhas NÃO ficam no repo.
- Gera contrato de site+manutenção (`app/lib/contrato-template.ts`) → imprime PDF → sobe no Autentique pra assinar.
- 🔲 `CONTRATADA` em `contrato-template.ts` está com placeholder: preencher dados reais da Boechat.
- ⚖️ Template estruturado no padrão de mercado, mas precisa de revisão de advogado antes de assinar com cliente.

## Fonte da verdade das decisões
`../maquina-de-caixa/00-estrategia/decisoes.md`.
