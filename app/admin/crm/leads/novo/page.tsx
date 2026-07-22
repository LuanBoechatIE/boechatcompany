import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createLead } from "../../../crm-actions";

export const dynamic = "force-dynamic";

const inputCls =
  "w-full rounded-xl border border-ink-line bg-ink p-3 text-base outline-none focus:border-roxo-light/60";

export default function NovoLead() {
  return (
    <div className="max-w-xl">
      <Link
        href="/admin/crm/leads"
        className="mb-4 flex w-fit items-center gap-1.5 text-sm text-gelo-dim hover:text-gelo"
      >
        <ArrowLeft className="h-4 w-4" />
        Leads
      </Link>

      <h1 className="mb-6 font-display text-3xl uppercase">Novo lead</h1>

      <form action={createLead} className="flex flex-col gap-5">
        <label className="flex flex-col gap-2">
          <span className="text-sm text-gelo-dim">Nome *</span>
          <input name="nome" required className={inputCls} placeholder="Nome do contato" />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-sm text-gelo-dim">Empresa</span>
            <input name="empresa" className={inputCls} placeholder="Nome do negócio" />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm text-gelo-dim">WhatsApp</span>
            <input name="whatsapp" className={inputCls} placeholder="(00) 00000-0000" />
          </label>
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-sm text-gelo-dim">E-mail</span>
          <input name="email" type="email" className={inputCls} placeholder="email@empresa.com" />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-sm text-gelo-dim">Setor</span>
            <input name="setor" className={inputCls} placeholder="Ex.: clínica, academia" />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm text-gelo-dim">Faturamento</span>
            <input name="faturamento" className={inputCls} placeholder="Ex.: até 50k/mês" />
          </label>
        </div>

        <div className="flex items-center gap-4">
          <button className="rounded-full bg-roxo px-6 py-3 text-sm font-medium text-white">
            Cadastrar lead
          </button>
          <Link href="/admin/crm/leads" className="text-sm text-gelo-dim hover:text-gelo">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
