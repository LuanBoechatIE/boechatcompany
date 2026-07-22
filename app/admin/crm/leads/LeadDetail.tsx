"use client";

import { useState } from "react";
import {
  X,
  UserRoundCheck,
  Archive,
  Trash2,
  CircleSlash,
  StickyNote,
  ListChecks,
  History,
  Check,
} from "lucide-react";
import {
  LEAD_STAGES,
  ORIGENS_LEAD,
  SERVICOS,
  RESPONSAVEIS,
  type LeadDTO,
  type AtividadeDTO,
} from "@/app/lib/crm/types";
import {
  updateLead,
  convertLeadToClient,
  markLeadLost,
  archiveLead,
  deleteLead,
  addAtividade,
  toggleAtividade,
  deleteAtividade,
} from "../../crm-actions";

const inputCls =
  "w-full rounded-xl border border-ink-line bg-ink p-2.5 text-sm outline-none focus:border-roxo-light/60";
const labelCls = "text-xs text-gelo-dim";

type Aba = "info" | "atividades";

const ATIV_ICON: Record<string, typeof StickyNote> = {
  nota: StickyNote,
  tarefa: ListChecks,
  evento: History,
};

export function LeadDetail({
  lead,
  atividades,
  onClose,
}: {
  lead: LeadDTO;
  atividades: AtividadeDTO[];
  onClose: () => void;
}) {
  const [aba, setAba] = useState<Aba>("info");
  const [perderOpen, setPerderOpen] = useState(false);
  const stage = LEAD_STAGES.find((s) => s.key === lead.status);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 flex h-full w-full max-w-xl flex-col border-l border-ink-line bg-ink-soft shadow-2xl">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-4 border-b border-ink-line p-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${stage?.dot ?? "bg-gelo/40"}`} />
              <span className="text-xs uppercase tracking-wide text-gelo-dim">
                {stage?.label ?? lead.status}
              </span>
            </div>
            <h2 className="mt-1 truncate font-display text-2xl uppercase text-gelo">
              {lead.empresa || lead.nome}
            </h2>
            {lead.empresa && lead.nome && lead.nome !== lead.empresa && (
              <p className="text-sm text-gelo-dim">{lead.nome}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg border border-ink-line bg-ink p-1.5 text-gelo-dim hover:text-gelo"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Ações */}
        <div className="flex flex-wrap gap-2 border-b border-ink-line px-5 py-3">
          {lead.status !== "convertido" && (
            <form action={convertLeadToClient}>
              <input type="hidden" name="id" value={lead.id} />
              <button className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200/90 hover:bg-emerald-500/20">
                <UserRoundCheck className="h-3.5 w-3.5" />
                Converter em cliente
              </button>
            </form>
          )}
          {lead.status !== "perdido" && (
            <button
              onClick={() => setPerderOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-ink-line bg-ink px-3 py-1.5 text-xs text-red-300/80 hover:border-red-500/30 hover:text-red-300"
            >
              <CircleSlash className="h-3.5 w-3.5" />
              Marcar perdido
            </button>
          )}
          <form action={archiveLead}>
            <input type="hidden" name="id" value={lead.id} />
            <button className="flex items-center gap-1.5 rounded-lg border border-ink-line bg-ink px-3 py-1.5 text-xs text-gelo-dim hover:text-gelo">
              <Archive className="h-3.5 w-3.5" />
              Arquivar
            </button>
          </form>
          <form action={deleteLead} className="ml-auto">
            <input type="hidden" name="id" value={lead.id} />
            <button className="flex items-center gap-1.5 rounded-lg border border-ink-line bg-ink px-3 py-1.5 text-xs text-red-300/70 hover:border-red-500/30 hover:text-red-300">
              <Trash2 className="h-3.5 w-3.5" />
              Excluir
            </button>
          </form>
        </div>

        {perderOpen && (
          <form
            action={markLeadLost}
            className="flex items-end gap-2 border-b border-ink-line bg-red-500/5 px-5 py-3"
          >
            <input type="hidden" name="id" value={lead.id} />
            <label className="flex flex-1 flex-col gap-1">
              <span className={labelCls}>Motivo da perda</span>
              <input
                name="motivo"
                placeholder="Ex.: sem orçamento, escolheu concorrente"
                className={inputCls}
                defaultValue={lead.motivoPerda}
              />
            </label>
            <button className="rounded-lg bg-red-500/80 px-4 py-2.5 text-xs font-medium text-white">
              Confirmar
            </button>
          </form>
        )}

        {/* Abas */}
        <div className="flex gap-2 border-b border-ink-line px-5">
          {(["info", "atividades"] as Aba[]).map((a) => (
            <button
              key={a}
              onClick={() => setAba(a)}
              className={`-mb-px border-b-2 px-2 py-2.5 text-sm transition-colors ${
                aba === a
                  ? "border-roxo-light font-medium text-gelo"
                  : "border-transparent text-gelo-dim hover:text-gelo"
              }`}
            >
              {a === "info" ? "Informações" : `Atividades (${atividades.length})`}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {aba === "info" ? (
            <form action={updateLead} className="flex flex-col gap-4">
              <input type="hidden" name="id" value={lead.id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className={labelCls}>Empresa / lead</span>
                  <input name="nome" defaultValue={lead.nome} className={inputCls} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className={labelCls}>Empresa</span>
                  <input name="empresa" defaultValue={lead.empresa} className={inputCls} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className={labelCls}>Pessoa de contato</span>
                  <input name="pessoaContato" defaultValue={lead.pessoaContato} className={inputCls} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className={labelCls}>Telefone</span>
                  <input name="telefone" defaultValue={lead.telefone} className={inputCls} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className={labelCls}>WhatsApp</span>
                  <input name="whatsapp" defaultValue={lead.whatsapp} className={inputCls} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className={labelCls}>E-mail</span>
                  <input name="email" type="email" defaultValue={lead.email} className={inputCls} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className={labelCls}>Serviço de interesse</span>
                  <select name="servico" defaultValue={lead.servico} className={inputCls}>
                    <option value="">—</option>
                    {SERVICOS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className={labelCls}>Origem</span>
                  <select name="origem" defaultValue={lead.origem} className={inputCls}>
                    <option value="">—</option>
                    {ORIGENS_LEAD.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className={labelCls}>Responsável</span>
                  <select name="responsavel" defaultValue={lead.responsavel} className={inputCls}>
                    <option value="">—</option>
                    {RESPONSAVEIS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className={labelCls}>Valor estimado (R$)</span>
                  <input name="valorEstimado" defaultValue={lead.valorEstimado ?? ""} placeholder="0,00" className={inputCls} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className={labelCls}>Próxima ação</span>
                  <input name="proximaAcao" defaultValue={lead.proximaAcao} className={inputCls} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className={labelCls}>Próximo contato</span>
                  <input name="proximoContato" type="date" defaultValue={lead.proximoContatoInput} className={inputCls} />
                </label>
              </div>
              <label className="flex flex-col gap-1">
                <span className={labelCls}>Tags (separadas por vírgula)</span>
                <input name="tags" defaultValue={lead.tags} className={inputCls} />
              </label>
              <label className="flex flex-col gap-1">
                <span className={labelCls}>Observações</span>
                <textarea name="observacoes" rows={3} defaultValue={lead.observacoes} className={inputCls} />
              </label>
              <button className="self-start rounded-full bg-roxo px-6 py-2.5 text-sm font-medium text-white">
                Salvar alterações
              </button>
            </form>
          ) : (
            <div className="flex flex-col gap-5">
              {/* Adicionar atividade */}
              <form action={addAtividade} className="flex flex-col gap-2 rounded-2xl border border-ink-line bg-ink p-4">
                <input type="hidden" name="leadId" value={lead.id} />
                <textarea name="texto" required rows={2} placeholder="Registrar nota ou próxima tarefa..." className={inputCls} />
                <div className="flex flex-wrap items-center gap-2">
                  <select name="tipo" defaultValue="nota" className="rounded-lg border border-ink-line bg-ink px-3 py-2 text-xs text-gelo-dim">
                    <option value="nota">Nota</option>
                    <option value="tarefa">Tarefa</option>
                  </select>
                  <input name="data" type="date" className="rounded-lg border border-ink-line bg-ink px-3 py-2 text-xs text-gelo-dim" title="Prazo (para tarefas)" />
                  <button className="ml-auto rounded-full bg-roxo px-5 py-2 text-xs font-medium text-white">
                    Registrar
                  </button>
                </div>
              </form>

              {/* Histórico */}
              {atividades.length === 0 ? (
                <p className="py-6 text-center text-sm text-gelo-dim/60">
                  Nenhuma atividade ainda.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {atividades.map((a) => {
                    const Icon = ATIV_ICON[a.tipo] ?? StickyNote;
                    return (
                      <li key={a.id} className="flex items-start gap-3 rounded-xl border border-ink-line bg-ink p-3">
                        {a.tipo === "tarefa" ? (
                          <form action={toggleAtividade}>
                            <input type="hidden" name="id" value={a.id} />
                            <input type="hidden" name="feito" value={String(a.feito)} />
                            <button
                              className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded border ${
                                a.feito
                                  ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                                  : "border-ink-line text-transparent hover:border-roxo-light"
                              }`}
                              aria-label="Concluir tarefa"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                          </form>
                        ) : (
                          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gelo-dim" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm ${a.feito ? "text-gelo-dim line-through" : "text-gelo"}`}>
                            {a.texto}
                          </p>
                          <p className="mt-0.5 text-[10px] text-gelo-dim/60">
                            {a.tipo}
                            {a.dataLabel ? ` · ${a.dataLabel}` : ""} · {a.criadoEmLabel}
                          </p>
                        </div>
                        <form action={deleteAtividade}>
                          <input type="hidden" name="id" value={a.id} />
                          <button className="rounded-md p-1 text-red-300/50 hover:text-red-300" aria-label="Excluir">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </form>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
