import Link from "next/link";
import { desc } from "drizzle-orm";
import { Plus, Trash2, MessageCircle, Mail, ArrowRight } from "lucide-react";
import { dbConfigured, getDb } from "@/app/lib/db";
import { crmClientes } from "@/app/lib/db/schema";
import { CrmSetupNotice } from "../CrmSetupNotice";
import { deleteCrmCliente } from "../../crm-actions";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  if (!dbConfigured()) return <CrmSetupNotice />;

  const { temPermissao } = await import("@/app/lib/perms-guard");
  const podeExcluir = await temPermissao("clientes.excluir");

  let lista: (typeof crmClientes.$inferSelect)[] = [];
  let erro = false;
  try {
    lista = await getDb()
      .select()
      .from(crmClientes)
      .orderBy(desc(crmClientes.criadoEm));
  } catch {
    erro = true;
  }
  if (erro) return <CrmSetupNotice />;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase">Clientes</h1>
          <p className="mt-1 text-sm text-gelo-dim">
            Contas ativas. Vêm de leads convertidos ou cadastro direto.
          </p>
        </div>
        <Link
          href="/admin/crm/clientes/novo"
          className="flex items-center gap-2 rounded-full bg-roxo px-6 py-3 text-sm font-medium text-white shadow-[0_8px_30px_-8px_rgba(109,40,217,0.7)] hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Novo cliente
        </Link>
      </div>

      {lista.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-line bg-ink-soft/20 p-10 text-center text-sm text-gelo-dim">
          Nenhum cliente ainda. Converte um{" "}
          <Link href="/admin/crm/leads" className="text-roxo-light underline">
            lead
          </Link>{" "}
          ou{" "}
          <Link href="/admin/crm/clientes/novo" className="text-roxo-light underline">
            cadastra direto
          </Link>
          .
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((c) => (
            <li
              key={c.id}
              className="flex flex-col gap-3 rounded-2xl border border-ink-line bg-ink-soft/30 p-5 transition-colors hover:border-roxo-light/30"
            >
              <div className="flex items-start justify-between gap-2">
                <Link href={`/admin/crm/clientes/${c.id}`} className="min-w-0">
                  <div className="font-medium text-gelo hover:text-roxo-light">{c.nome}</div>
                  {c.empresa && (
                    <div className="mt-0.5 truncate text-xs text-gelo-dim">{c.empresa}</div>
                  )}
                </Link>
                {podeExcluir && (
                <form action={deleteCrmCliente}>
                  <input type="hidden" name="id" value={c.id} />
                  <button
                    className="rounded-lg border border-ink-line bg-ink p-1.5 text-red-300/70 hover:border-red-500/30 hover:text-red-300"
                    aria-label="Excluir cliente"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </form>
                )}
              </div>

              <div className="flex flex-col gap-1.5 text-xs text-gelo-dim">
                {c.whatsapp && (
                  <span className="flex items-center gap-2">
                    <MessageCircle className="h-3.5 w-3.5" />
                    {c.whatsapp}
                  </span>
                )}
                {c.email && (
                  <span className="flex items-center gap-2 truncate">
                    <Mail className="h-3.5 w-3.5" />
                    {c.email}
                  </span>
                )}
              </div>

              <Link
                href={`/admin/crm/clientes/${c.id}`}
                className="flex items-center gap-1 text-xs text-roxo-light hover:underline"
              >
                Ver contratos e projetos
                <ArrowRight className="h-3 w-3" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
