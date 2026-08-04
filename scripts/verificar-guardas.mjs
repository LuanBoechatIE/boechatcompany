#!/usr/bin/env node
// Falha (exit 1) se alguma Server Action nascer sem guarda de autorização.
//
// Por que existe: no Next, middleware NÃO protege Server Action (elas são
// despachadas pelo header Next-Action, não pela rota). A única barreira é uma
// guarda DENTRO da função. Este check impede que a próxima feature reintroduza
// o C1 da auditoria — uma action exportada sem checagem = endpoint público.
//
// Uso:  node scripts/verificar-guardas.mjs
// CI:   adicione como passo antes do build.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const RAIZ = "app";

// Chamadas que contam como guarda na primeira parte do corpo da função.
const GUARDAS = [
  "exigirPermissao",
  "exigirPermissaoAtor",
  "exigirSuperAdmin",
  "exigirSessao",
  "getSessaoAtual",
  "getPermsAtuais",
  "getUsuarioAtual",
  "temPermissao",
  "semAcessoAoLead",
  "await ctx()",       // padrão local de demandas-aprovacao
  "usernameAtual()",   // padrão local de perfil
  "decisaoInterna(",   // despachante guardado (ctx + permissão) de demandas-aprovacao
];

// Actions deliberadamente públicas (fluxo por token, já validam token + rate
// limit) ou seguras sem sessão. Qualquer adição aqui é uma decisão consciente.
const PERMITIDAS_SEM_GUARDA = new Set([
  "submitOnboarding",   // app/onboarding/[token] — público via token
  "submitCandidatura",  // app/vagas/[token] — público via token
  "logout",             // apagar o próprio cookie é seguro pra qualquer um
]);

function listarActions(dir) {
  const out = [];
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    const st = statSync(caminho);
    if (st.isDirectory()) out.push(...listarActions(caminho));
    else if (/actions.*\.ts$/.test(nome) || nome === "actions.ts") out.push(caminho);
  }
  return out;
}

function ehArquivoUseServer(conteudo) {
  const primeira = conteudo.split("\n").find((l) => l.trim() && !l.trim().startsWith("//"));
  return primeira && /["']use server["']/.test(primeira);
}

const problemas = [];
for (const arquivo of listarActions(RAIZ)) {
  const conteudo = readFileSync(arquivo, "utf8");
  if (!ehArquivoUseServer(conteudo)) continue; // só arquivos que expõem actions
  const linhas = conteudo.split("\n");

  for (let i = 0; i < linhas.length; i++) {
    const m = linhas[i].match(/^export async function (\w+)/);
    if (!m) continue;
    const nome = m[1];
    if (PERMITIDAS_SEM_GUARDA.has(nome)) continue;

    // Olha o corpo até a próxima função exportada ou o fim natural do arquivo.
    let temGuarda = false;
    for (let j = i + 1; j < linhas.length && j < i + 40; j++) {
      if (/^export async function /.test(linhas[j])) break;
      if (GUARDAS.some((g) => linhas[j].includes(g))) { temGuarda = true; break; }
    }
    if (!temGuarda) problemas.push(`${arquivo}:${i + 1}  ${nome}`);
  }
}

if (problemas.length) {
  console.error("❌ Server Actions sem guarda de autorização:\n");
  for (const p of problemas) console.error("   " + p);
  console.error(
    "\nToda action precisa de uma guarda (exigirPermissao/exigirSessao/...) na " +
    "primeira parte do corpo. Se for realmente pública, adicione o nome a " +
    "PERMITIDAS_SEM_GUARDA em scripts/verificar-guardas.mjs, de forma consciente.",
  );
  process.exit(1);
}

console.log("✅ Todas as Server Actions têm guarda de autorização.");
