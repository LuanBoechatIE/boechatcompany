// Compilador de Brief: destila os arquivos de vault de um produto num
// documento denso (~8k tokens) que serve de contexto cacheado pra IA.
//
// É a alternativa deliberada a RAG (decisão de 2026-07-26). RAG devolveria
// fragmentos sem narrativa; o que a IA precisa aqui é de estratégia coerente:
// o que é o produto, pra quem, qual a promessa, quais objeções, quais provas
// REAIS, e o que é proibido dizer.
//
// Roda raramente: só quando o SHA de algum arquivo de origem muda.
import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import { contProdutos, type ContProduto } from "@/app/lib/db/schema";
import { docsPorGlobs } from "./sync";
import { gerarTexto, estimarTokens, MODELO_GERACAO } from "../ia/claude";

const REGRAS_DA_CASA = `
REGRAS DE MARCA DA BOECHAT COMPANY (valem em tudo que você escrever):
- Nunca vender "IA", automação ou tecnologia no discurso externo. A IA é motor interno; vende-se RESULTADO.
- Proibido travessão na copy. Use ponto, vírgula ou reescreva a frase.
- Proibida a palavra "premium". Use "afiado", "alto desempenho", "à altura".
- Tom da marca: ousado, direto, vendedor.
- Nenhuma métrica, número ou prova social pode ser inventada. Se o vault não traz o número, o brief registra que não existe.
`.trim();

const INSTRUCAO_BRIEF = `
Você é o estrategista-chefe da Boechat Company. Recebeu os documentos internos de estratégia de UM produto e precisa destilá-los num BRIEF operacional.

Esse brief vai ser o contexto que um redator usa pra produzir conteúdo sobre esse produto, todo dia, sem reler os documentos originais. Ele precisa ser denso e autossuficiente.

Escreva em markdown, em português, com exatamente estas seções:

## O que é
Uma descrição concreta do produto em até 4 frases. Nada de adjetivo vazio.

## Para quem
O ICP real: tipo de negócio, porte, momento, quem decide. Se o vault distingue camadas (marca ampla vs. outbound nichado), respeite a distinção.

## A dor antes
O que dói no cliente ANTES de comprar. Em linguagem que o cliente usaria, não a nossa.

## A promessa
O resultado prometido, e o mecanismo que o sustenta.

## Preço e condições
Faixa, forma de pagamento, recorrência, o que está incluso e o que não está. Se o vault diz que o preço é faixa e não número rígido, registre isso.

## Provas reais disponíveis
Só o que o vault confirma como verdadeiro. Cite o número e de onde vem. Se não houver prova confirmada, escreva exatamente: "Nenhuma prova numérica confirmada no vault."

## Objeções e respostas
As objeções reais que aparecem, com a direção de resposta. Uma linha por objeção.

## Ganchos de conteúdo já validados
Ângulos, frases e teses que o vault já fechou e que funcionam pra esse produto.

## Proibido dizer
O que NÃO pode aparecer em conteúdo sobre esse produto: promessas que a empresa não sustenta, termos vetados, decisões descartadas que não devem voltar.

Regras de execução:
- Extraia, não invente. Se algo não está nos documentos, não entre no brief.
- Prefira o específico ao genérico: número, nome, frase literal.
- Onde o vault registrar uma DECISÃO fechada, trate como lei, não como sugestão.
- Alvo de tamanho: entre 900 e 1.600 palavras. Denso, sem enchimento.
`.trim();

/** Hash dos SHAs de origem: se não mudou, o brief está atualizado. */
function hashDeOrigem(docs: { path: string; sha: string }[]): string {
  const h = createHash("sha256");
  for (const d of [...docs].sort((a, b) => a.path.localeCompare(b.path))) {
    h.update(`${d.path}:${d.sha}\n`);
  }
  return h.digest("hex").slice(0, 32);
}

export type ResultadoBrief = {
  slug: string;
  status: "compilado" | "atualizado" | "sem-fontes";
  docs: number;
  tokens: number;
};

/**
 * Recompila o brief de um produto.
 * `forcar` ignora o hash e recompila mesmo sem mudança de origem.
 */
export async function compilarBrief(
  produto: ContProduto,
  forcar = false,
): Promise<ResultadoBrief> {
  const db = getDb();
  const docs = await docsPorGlobs(produto.vaultGlobs);

  if (docs.length === 0) {
    return { slug: produto.slug, status: "sem-fontes", docs: 0, tokens: 0 };
  }

  const hash = hashDeOrigem(docs);
  if (!forcar && hash === produto.briefFonteHash && produto.briefMd) {
    return {
      slug: produto.slug,
      status: "atualizado",
      docs: docs.length,
      tokens: produto.briefTokens,
    };
  }

  const fontes = docs
    .map((d) => `<documento path="${d.path}" titulo="${d.titulo}">\n${d.conteudo}\n</documento>`)
    .join("\n\n");

  // As duas camadas estáveis (regras + instrução) ficam cacheadas; as fontes
  // mudam a cada produto, então vão na mensagem do usuário.
  const { texto, uso } = await gerarTexto({
    camadas: [
      { texto: REGRAS_DA_CASA, estavel: true },
      { texto: INSTRUCAO_BRIEF, estavel: true },
    ],
    instrucao: `Produto: ${produto.nome}\n${produto.descricao}\n\nDocumentos do vault:\n\n${fontes}`,
    // Extração fiel, não invenção criativa: effort alto não paga aqui.
    effort: "medium",
    maxTokens: 8000,
  });

  const tokens = estimarTokens(texto);
  await db
    .update(contProdutos)
    .set({
      briefMd: texto,
      briefFonteHash: hash,
      briefTokens: tokens,
      briefModelo: uso.modelo || MODELO_GERACAO,
      briefGeradoEm: new Date(),
    })
    .where(eq(contProdutos.id, produto.id));

  return {
    slug: produto.slug,
    status: "compilado",
    docs: docs.length,
    tokens,
  };
}

/** Brief da marca (camada L0). Vazio se ainda não foi compilado. */
export async function briefDaMarca(): Promise<string> {
  const linhas = await getDb()
    .select({ briefMd: contProdutos.briefMd })
    .from(contProdutos)
    .where(eq(contProdutos.ehMarca, true))
    .limit(1);
  return linhas[0]?.briefMd ?? "";
}
