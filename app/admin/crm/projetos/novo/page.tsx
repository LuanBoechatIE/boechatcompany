import Link from "next/link";
import { desc } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { dbConfigured, getDb } from "@/app/lib/db";
import { crmClientes } from "@/app/lib/db/schema";
import { CrmSetupNotice } from "../../CrmSetupNotice";
import { createProjeto } from "../../../crm-actions";

export const dynamic = "force-dynamic";

const inputCls =
  "w-full rounded-xl border border-ink-line bg-ink p-3 text-base outline-none focus:border-roxo-light/60";

export default async function NovoProjeto() {
  if (!dbConfigured()) return <CrmSetupNotice />;

  let clientes: { id: number; nome: string }[] = [];
  try {
    clientes = await getDb()
      .select({ id: crmClientes.id, nome: crmClientes.nome })
      .from(crmClientes)
      .orderBy(desc(crmClientes.criadoEm));
  } catch {
    return <CrmSetupNotice />;
  }

  return (
    <div className="max-w-xl">
      <Link
        href="/admin/crm/projetos"
        className="mb-4 flex w-fit items-center gap-1.5 text-sm text-gelo-dim hover:text-gelo"
      >
        <ArrowLeft className="h-4 w-4" />
        Projetos
      </Link>

      <h1 className="mb-6 font-display text-3xl uppercase">Novo projeto</h1>

      <form action={createProjeto} className="flex flex-col gap-5">
        <label className="flex flex-col gap-2">
          <span className="text-sm text-gelo-dim">Nome do projeto *</span>
          <input name="nome" required className={inputCls} placeholder="Ex.: Site + tráfego CT Power" />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm text-gelo-dim">Cliente (opcional)</span>
          <select name="clienteId" defaultValue="" className={inputCls}>
            <option value="">Sem cliente vinculado</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm text-gelo-dim">Briefing (opcional)</span>
          <textarea name="briefing" rows={4} className={inputCls} placeholder="O que é esse projeto, objetivo, escopo" />
        </label>

        <div className="flex items-center gap-4">
          <button className="rounded-full bg-roxo px-6 py-3 text-sm font-medium text-white">
            Criar projeto
          </button>
          <Link href="/admin/crm/projetos" className="text-sm text-gelo-dim hover:text-gelo">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
