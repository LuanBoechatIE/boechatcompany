import { dbConfigured } from "@/app/lib/db";
import { iaConfigurada } from "@/app/lib/conteudo/ia/claude";
import { vaultConfigurado } from "@/app/lib/conteudo/vault/sync";
import { contarDocsDoVault, listarProdutos } from "../actions";
import { PainelProdutos } from "./PainelProdutos";

export const dynamic = "force-dynamic";

export default async function ProdutosPage() {
  if (!dbConfigured()) {
    return (
      <p className="text-gelo-dim">
        Banco não configurado. Defina DATABASE_URL na Vercel.
      </p>
    );
  }

  const [produtos, docs] = await Promise.all([
    listarProdutos(),
    contarDocsDoVault(),
  ]);

  return (
    <PainelProdutos
      produtos={produtos}
      docsNoVault={docs}
      vaultOk={vaultConfigurado()}
      iaOk={iaConfigurada()}
    />
  );
}
