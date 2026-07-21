import Link from "next/link";
import { desc } from "drizzle-orm";
import { dbConfigured, getDb } from "@/app/lib/db";
import { presets } from "@/app/lib/db/schema";
import { SetupNotice } from "../../SetupNotice";
import { createClient } from "../../actions";

export const dynamic = "force-dynamic";

const inputCls =
  "w-full rounded-xl border border-ink-line bg-ink p-3 text-base outline-none focus:border-roxo-light/60";

export default async function NovoCliente() {
  if (!dbConfigured()) return <SetupNotice />;

  let lista: { id: number; nome: string }[] = [];
  let erro = false;
  try {
    lista = await getDb()
      .select({ id: presets.id, nome: presets.nome })
      .from(presets)
      .orderBy(desc(presets.criadoEm));
  } catch {
    erro = true;
  }
  if (erro) return <SetupNotice tabelas />;

  if (lista.length === 0) {
    return (
      <div className="max-w-xl rounded-2xl border border-ink-line bg-ink-soft/30 p-8 text-sm text-gelo-dim">
        Antes de cadastrar um cliente, crie ao menos um{" "}
        <Link href="/admin/presets/novo" className="text-roxo-light underline">
          preset de oferta
        </Link>
        . É ele que define quais perguntas o cliente vai responder.
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 font-display text-3xl uppercase">Novo cliente</h1>
      <form action={createClient} className="flex flex-col gap-5">
        <label className="flex flex-col gap-2">
          <span className="text-sm text-gelo-dim">Nome do cliente / negócio</span>
          <input name="nome" required className={inputCls} placeholder="Ex.: CT Power" />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm text-gelo-dim">Contato (opcional)</span>
          <input name="contato" className={inputCls} placeholder="WhatsApp, e-mail, referência" />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm text-gelo-dim">Oferta (preset)</span>
          <select name="presetId" required className={inputCls} defaultValue="">
            <option value="" disabled>
              Escolha a oferta
            </option>
            {lista.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-4">
          <button className="rounded-full bg-roxo px-6 py-3 text-sm font-medium text-white">
            Criar e gerar link
          </button>
          <Link href="/admin" className="text-sm text-gelo-dim hover:text-gelo">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
