"use server";

import { revalidatePath } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import { contProdutos, contVaultDocs } from "@/app/lib/db/schema";
import { PRODUTOS_PADRAO } from "@/app/lib/conteudo/vault/produtos-padrao";
import { sincronizarVault, docsPorGlobs } from "@/app/lib/conteudo/vault/sync";
import { compilarBrief } from "@/app/lib/conteudo/vault/brief";

export type Estado = { ok: boolean; msg: string };

/**
 * Cria os produtos que ainda não existem, a partir da semente.
 * Nunca sobrescreve o que já está no banco: os globs são editáveis e a
 * edição do usuário vale mais que a semente.
 */
export async function semearProdutos(): Promise<Estado> {
  const db = getDb();
  const existentes = await db
    .select({ slug: contProdutos.slug })
    .from(contProdutos);
  const jaTem = new Set(existentes.map((p) => p.slug));

  const novos = PRODUTOS_PADRAO.filter((p) => !jaTem.has(p.slug));
  if (novos.length > 0) {
    await db.insert(contProdutos).values(novos);
  }

  revalidatePath("/conteudo/produtos");
  return {
    ok: true,
    msg:
      novos.length === 0
        ? "Nenhum produto novo pra criar."
        : `${novos.length} produto(s) criado(s): ${novos.map((p) => p.nome).join(", ")}.`,
  };
}

/** Puxa o vault do GitHub pro espelho no Postgres. */
export async function sincronizar(): Promise<Estado> {
  try {
    const r = await sincronizarVault();
    revalidatePath("/conteudo/produtos");
    return {
      ok: true,
      msg: `Vault sincronizado: ${r.total} arquivos (${r.criados} novos, ${r.atualizados} atualizados, ${r.removidos} removidos, ${r.inalterados} sem mudança).`,
    };
  } catch (e) {
    return { ok: false, msg: (e as Error).message };
  }
}

/** Recompila o brief de um produto. Pula se as fontes não mudaram. */
export async function recompilarBrief(
  produtoId: number,
  forcar = false,
): Promise<Estado> {
  try {
    const linhas = await getDb()
      .select()
      .from(contProdutos)
      .where(eq(contProdutos.id, produtoId))
      .limit(1);
    const produto = linhas[0];
    if (!produto) return { ok: false, msg: "Produto não encontrado." };

    const r = await compilarBrief(produto, forcar);
    revalidatePath("/conteudo/produtos");

    if (r.status === "sem-fontes") {
      return {
        ok: false,
        msg: `Nenhum arquivo do vault casou com os globs de ${produto.nome}. Sincronize o vault ou ajuste os globs.`,
      };
    }
    if (r.status === "atualizado") {
      return {
        ok: true,
        msg: `Brief de ${produto.nome} já estava atualizado (${r.docs} arquivos de origem).`,
      };
    }
    return {
      ok: true,
      msg: `Brief de ${produto.nome} compilado: ${r.docs} arquivos, ~${r.tokens.toLocaleString("pt-BR")} tokens.`,
    };
  } catch (e) {
    return { ok: false, msg: (e as Error).message };
  }
}

export type ProdutoNaTela = {
  id: number;
  slug: string;
  nome: string;
  descricao: string;
  ehMarca: boolean;
  vaultGlobs: string[];
  briefTokens: number;
  briefGeradoEm: Date | null;
  briefModelo: string;
  temBrief: boolean;
  /** Fontes que os globs realmente encontram hoje no espelho. */
  fontes: number;
  /** true quando o vault mudou desde a última compilação. */
  desatualizado: boolean;
};

export async function listarProdutos(): Promise<ProdutoNaTela[]> {
  const db = getDb();
  const produtos = await db
    .select()
    .from(contProdutos)
    .orderBy(asc(contProdutos.ordem), asc(contProdutos.nome));

  return Promise.all(
    produtos.map(async (p) => {
      const docs = await docsPorGlobs(p.vaultGlobs);
      // Reproduz o hash do compilador sem importar node:crypto na página.
      const assinatura = [...docs]
        .sort((a, b) => a.path.localeCompare(b.path))
        .map((d) => `${d.path}:${d.sha}`)
        .join("\n");
      const { createHash } = await import("node:crypto");
      const hash = createHash("sha256")
        .update(assinatura ? `${assinatura}\n` : "")
        .digest("hex")
        .slice(0, 32);

      return {
        id: p.id,
        slug: p.slug,
        nome: p.nome,
        descricao: p.descricao,
        ehMarca: p.ehMarca,
        vaultGlobs: p.vaultGlobs,
        briefTokens: p.briefTokens,
        briefGeradoEm: p.briefGeradoEm,
        briefModelo: p.briefModelo,
        temBrief: p.briefMd.length > 0,
        fontes: docs.length,
        desatualizado:
          p.briefMd.length > 0 && docs.length > 0 && hash !== p.briefFonteHash,
      };
    }),
  );
}

export async function contarDocsDoVault(): Promise<number> {
  const linhas = await getDb()
    .select({ path: contVaultDocs.path })
    .from(contVaultDocs);
  return linhas.length;
}

export async function lerBrief(produtoId: number): Promise<string> {
  const linhas = await getDb()
    .select({ briefMd: contProdutos.briefMd })
    .from(contProdutos)
    .where(eq(contProdutos.id, produtoId))
    .limit(1);
  return linhas[0]?.briefMd ?? "";
}
