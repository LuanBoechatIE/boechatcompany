"use client";

import { X } from "lucide-react";
import {
  ORIGENS_LEAD,
  SERVICOS,
  RESPONSAVEIS,
} from "@/app/lib/crm/types";
import { createLead } from "../../crm-actions";

const inputCls =
  "w-full rounded-xl border border-ink-line bg-ink p-2.5 text-sm outline-none focus:border-roxo-light/60";
const labelCls = "text-xs text-gelo-dim";

export function NovoLead({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 flex h-full w-full max-w-lg flex-col border-l border-ink-line bg-ink-soft shadow-2xl">
        <div className="flex items-center justify-between border-b border-ink-line p-5">
          <h2 className="font-display text-2xl uppercase text-gelo">Novo lead</h2>
          <button
            onClick={onClose}
            className="rounded-lg border border-ink-line bg-ink p-1.5 text-gelo-dim hover:text-gelo"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          action={async (fd) => {
            await createLead(fd);
            onClose();
          }}
          className="flex flex-1 flex-col gap-4 overflow-y-auto p-5"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className={labelCls}>Nome do lead *</span>
              <input name="nome" required className={inputCls} placeholder="Contato ou negócio" />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelCls}>Empresa</span>
              <input name="empresa" className={inputCls} />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelCls}>Pessoa de contato</span>
              <input name="pessoaContato" className={inputCls} />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelCls}>Telefone</span>
              <input name="telefone" className={inputCls} />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelCls}>WhatsApp</span>
              <input name="whatsapp" className={inputCls} />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelCls}>E-mail</span>
              <input name="email" type="email" className={inputCls} />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelCls}>Serviço de interesse</span>
              <select name="servico" defaultValue="" className={inputCls}>
                <option value="">—</option>
                {SERVICOS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelCls}>Origem</span>
              <select name="origem" defaultValue="" className={inputCls}>
                <option value="">—</option>
                {ORIGENS_LEAD.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelCls}>Responsável</span>
              <select name="responsavel" defaultValue="" className={inputCls}>
                <option value="">—</option>
                {RESPONSAVEIS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelCls}>Valor estimado (R$)</span>
              <input name="valorEstimado" placeholder="0,00" className={inputCls} />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelCls}>Próxima ação</span>
              <input name="proximaAcao" className={inputCls} />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelCls}>Próximo contato</span>
              <input name="proximoContato" type="date" className={inputCls} />
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <span className={labelCls}>Tags (separadas por vírgula)</span>
            <input name="tags" className={inputCls} placeholder="quente, indicação" />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelCls}>Observações</span>
            <textarea name="observacoes" rows={2} className={inputCls} />
          </label>
          <button className="self-start rounded-full bg-roxo px-6 py-2.5 text-sm font-medium text-white">
            Cadastrar lead
          </button>
        </form>
      </div>
    </div>
  );
}
