"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, Clock, XCircle, RotateCcw, History, UserCheck, X } from "lucide-react";
import {
  marcarConcluida,
  registrarAprovacaoCliente,
  aprovarDemanda,
  rejeitarDemanda,
  solicitarAlteracoes,
  cancelarAprovacao,
  getHistoricoAprovacao,
  type DemandaAprovacao,
  type AprovacaoPermsView,
  type HistoricoItem,
} from "@/app/admin/demandas-aprovacao-actions";

const CANAIS = ["WhatsApp", "Instagram", "E-mail", "Ligação", "Reunião", "Presencial", "Portal do cliente", "Outro"];

const APROVACAO_LABEL: Record<string, { txt: string; cls: string }> = {
  nao_enviada: { txt: "Não enviada", cls: "border-ink-line text-gelo-dim" },
  aguardando: { txt: "Aguardando aprovação", cls: "border-yellow-500/30 bg-yellow-500/10 text-yellow-200/90" },
  aprovada: { txt: "Aprovada", cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200/90" },
  alteracoes_solicitadas: { txt: "Alterações solicitadas", cls: "border-orange-500/30 bg-orange-500/10 text-orange-200/90" },
  rejeitada: { txt: "Rejeitada", cls: "border-red-500/30 bg-red-500/10 text-red-300" },
  cancelada: { txt: "Aprovação cancelada", cls: "border-ink-line text-gelo-dim" },
};
const EXEC_LABEL: Record<string, string> = { backlog: "Pendente", andamento: "Em andamento", revisao: "Revisão", concluido: "Concluída" };

const inputCls = "w-full rounded-xl border border-ink-line bg-ink p-2.5 text-sm text-gelo outline-none focus:border-roxo-light/60";
const lbl = "text-xs text-gelo-dim";

export function AprovacoesPanel({ perms, demandas }: { perms: AprovacaoPermsView; demandas: DemandaAprovacao[] }) {
  const [toast, setToast] = useState<{ msg: string; erro?: boolean } | null>(null);
  const [cliente, setCliente] = useState<DemandaAprovacao | null>(null);
  const [decisao, setDecisao] = useState<{ d: DemandaAprovacao; tipo: "aprovar" | "rejeitar" | "alteracoes" | "cancelar" } | null>(null);
  const [historico, setHistorico] = useState<{ d: DemandaAprovacao; itens: HistoricoItem[] } | null>(null);
  const [, start] = useTransition();

  function notificar(msg: string, erro?: boolean) {
    setToast({ msg, erro });
    setTimeout(() => setToast(null), 3500);
  }
  function run(fn: () => Promise<{ ok: boolean; erro?: string }>, ok: string, done?: () => void) {
    start(async () => {
      const r = await fn();
      notificar(r.ok ? ok : r.erro ?? "Falha.", !r.ok);
      if (r.ok) done?.();
    });
  }

  const grupos = useMemo(() => {
    const aConcluir = demandas.filter((d) => (d.approvalStatus === "nao_enviada" || d.approvalStatus === "alteracoes_solicitadas") && (d.ehMinha || perms.pode.concluirAny || perms.superAdmin));
    const aguardando = demandas.filter((d) => d.approvalStatus === "aguardando");
    const decididas = demandas.filter((d) => ["aprovada", "rejeitada", "cancelada"].includes(d.approvalStatus));
    return { aConcluir, aguardando, decididas };
  }, [demandas, perms]);

  async function abrirHistorico(d: DemandaAprovacao) {
    const itens = await getHistoricoAprovacao(d.id);
    setHistorico({ d, itens });
  }

  function Badges({ d }: { d: DemandaAprovacao }) {
    const ap = APROVACAO_LABEL[d.approvalStatus] ?? APROVACAO_LABEL.nao_enviada;
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-full border border-ink-line px-2 py-0.5 text-[10px] uppercase text-gelo-dim">Exec: {EXEC_LABEL[d.status] ?? d.status}</span>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase ${ap.cls}`}>{ap.txt}</span>
        {d.rodada > 1 && <span className="rounded-full border border-ink-line px-2 py-0.5 text-[10px] text-gelo-dim">Rodada {d.rodada}</span>}
      </div>
    );
  }

  function Linha({ d, children }: { d: DemandaAprovacao; children?: React.ReactNode }) {
    return (
      <li className="flex flex-col gap-2 rounded-xl border border-ink-line bg-ink/40 p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm text-gelo">{d.titulo}</div>
            <div className="text-xs text-gelo-dim">{d.clienteNome ?? "Boechat"}{d.responsavel ? ` · ${d.responsavel}` : ""}{d.completedEmLabel ? ` · concluída ${d.completedEmLabel}` : ""}</div>
          </div>
          <Badges d={d} />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {children}
          {(perms.pode.verHistorico || d.ehMinha) && (
            <button onClick={() => abrirHistorico(d)} className="flex items-center gap-1.5 rounded-lg border border-ink-line bg-ink px-2.5 py-1.5 text-xs text-gelo-dim hover:text-gelo"><History className="h-3.5 w-3.5" /> Histórico</button>
          )}
        </div>
      </li>
    );
  }

  const btn = "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs";

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-ink-line bg-ink-soft/30 p-5">
      <div>
        <h2 className="flex items-center gap-2 font-display text-lg uppercase text-gelo"><UserCheck className="h-4 w-4" /> Aprovações</h2>
        <p className="mt-1 text-sm text-gelo-dim">Conclusão e aprovação são etapas diferentes. Uma demanda concluída fica “aguardando aprovação” até uma decisão.</p>
      </div>

      {grupos.aConcluir.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-gelo-dim">Prontas para concluir / reenviar</h3>
          <ul className="flex flex-col gap-2">
            {grupos.aConcluir.map((d) => (
              <Linha key={d.id} d={d}>
                <button onClick={() => run(() => marcarConcluida(d.id), "Demanda concluída, aguardando aprovação.")} className={`${btn} border-emerald-500/30 bg-ink text-emerald-300 hover:bg-emerald-500/10`}>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Marcar como concluída
                </button>
              </Linha>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3 className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gelo-dim"><Clock className="h-3.5 w-3.5" /> Aguardando aprovação ({grupos.aguardando.length})</h3>
        {grupos.aguardando.length === 0 ? (
          <p className="rounded-xl border border-dashed border-ink-line bg-ink/30 p-4 text-center text-xs text-gelo-dim">Nada aguardando aprovação.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {grupos.aguardando.map((d) => (
              <Linha key={d.id} d={d}>
                {((perms.pode.registrarCliente && d.ehMinha) || perms.superAdmin) && (
                  <button onClick={() => setCliente(d)} className={`${btn} border-ink-line bg-ink text-gelo-dim hover:text-gelo`}><UserCheck className="h-3.5 w-3.5" /> Cliente aprovou</button>
                )}
                {perms.pode.aprovar && <button onClick={() => setDecisao({ d, tipo: "aprovar" })} className={`${btn} border-emerald-500/30 bg-ink text-emerald-300 hover:bg-emerald-500/10`}><CheckCircle2 className="h-3.5 w-3.5" /> Aprovar</button>}
                {perms.pode.solicitarAlteracoes && <button onClick={() => setDecisao({ d, tipo: "alteracoes" })} className={`${btn} border-orange-500/30 bg-ink text-orange-300 hover:bg-orange-500/10`}><RotateCcw className="h-3.5 w-3.5" /> Solicitar alterações</button>}
                {perms.pode.rejeitar && <button onClick={() => setDecisao({ d, tipo: "rejeitar" })} className={`${btn} border-red-500/30 bg-ink text-red-300 hover:bg-red-500/10`}><XCircle className="h-3.5 w-3.5" /> Rejeitar</button>}
              </Linha>
            ))}
          </ul>
        )}
      </section>

      {grupos.decididas.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-gelo-dim">Decididas</h3>
          <ul className="flex flex-col gap-2">
            {grupos.decididas.map((d) => (
              <Linha key={d.id} d={d}>
                {d.approvalStatus === "aprovada" && perms.pode.cancelar && (
                  <button onClick={() => setDecisao({ d, tipo: "cancelar" })} className={`${btn} border-ink-line bg-ink text-gelo-dim hover:text-red-300`}><X className="h-3.5 w-3.5" /> Cancelar aprovação</button>
                )}
              </Linha>
            ))}
          </ul>
        </section>
      )}

      {cliente && <ClienteModal d={cliente} onClose={() => setCliente(null)} onSalvar={(fd) => run(() => registrarAprovacaoCliente(fd), "Aprovação do cliente registrada.", () => setCliente(null))} />}
      {decisao && <DecisaoModal decisao={decisao} onClose={() => setDecisao(null)} onConfirmar={(fd) => {
        const map = {
          aprovar: () => aprovarDemanda(fd),
          rejeitar: () => rejeitarDemanda(fd),
          alteracoes: () => solicitarAlteracoes(fd),
          cancelar: () => cancelarAprovacao(fd),
        };
        const msg = { aprovar: "Demanda aprovada.", rejeitar: "Demanda rejeitada.", alteracoes: "Alterações solicitadas.", cancelar: "Aprovação cancelada." };
        run(map[decisao.tipo], msg[decisao.tipo], () => setDecisao(null));
      }} />}
      {historico && <HistoricoModal data={historico} onClose={() => setHistorico(null)} />}

      {toast && (
        <div className={`fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-xl border px-4 py-2.5 text-sm shadow-xl ${toast.erro ? "border-red-500/40 bg-red-500/15 text-red-100" : "border-emerald-500/40 bg-emerald-500/15 text-emerald-100"}`}>{toast.msg}</div>
      )}
    </div>
  );
}

function ModalBase({ titulo, onClose, children }: { titulo: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-md rounded-2xl border border-ink-line bg-ink-soft shadow-2xl">
        <div className="flex items-center justify-between border-b border-ink-line px-5 py-4">
          <h3 className="font-display text-base uppercase text-gelo">{titulo}</h3>
          <button onClick={onClose} className="text-gelo-dim hover:text-gelo"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ClienteModal({ d, onClose, onSalvar }: { d: DemandaAprovacao; onClose: () => void; onSalvar: (fd: FormData) => void }) {
  const hoje = new Date().toISOString().slice(0, 10);
  const [nome, setNome] = useState("");
  const [canal, setCanal] = useState("WhatsApp");
  const [data, setData] = useState(hoje);
  const [hora, setHora] = useState("12:00");
  const [nota, setNota] = useState("");
  function salvar() {
    const fd = new FormData();
    fd.set("demandaId", String(d.id));
    fd.set("aprovadorNome", nome);
    fd.set("canal", canal);
    fd.set("data", data);
    fd.set("hora", hora);
    fd.set("nota", nota);
    onSalvar(fd);
  }
  return (
    <ModalBase titulo="Registrar aprovação do cliente" onClose={onClose}>
      <div className="flex flex-col gap-3 p-5">
        <p className="text-xs text-gelo-dim">Você registra que o <strong className="text-gelo">cliente</strong> aprovou. O aprovador é o cliente; você aparece como quem registrou.</p>
        <label className="flex flex-col gap-1"><span className={lbl}>Quem aprovou (cliente/contato)</span><input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: João, da CT Power" className={inputCls} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1"><span className={lbl}>Canal</span><select value={canal} onChange={(e) => setCanal(e.target.value)} className={inputCls}>{CANAIS.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
          <label className="flex flex-col gap-1"><span className={lbl}>Data</span><input type="date" value={data} onChange={(e) => setData(e.target.value)} className={inputCls} /></label>
        </div>
        <label className="flex flex-col gap-1"><span className={lbl}>Horário</span><input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className={inputCls} /></label>
        <label className="flex flex-col gap-1"><span className={lbl}>Observação (opcional)</span><textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={2} className={inputCls} /></label>
      </div>
      <div className="flex justify-end gap-2 border-t border-ink-line px-5 py-4">
        <button onClick={onClose} className="rounded-lg border border-ink-line px-4 py-2 text-sm text-gelo-dim hover:text-gelo">Cancelar</button>
        <button onClick={salvar} className="rounded-lg bg-roxo px-5 py-2 text-sm font-medium text-white hover:opacity-90">Registrar</button>
      </div>
    </ModalBase>
  );
}

function DecisaoModal({ decisao, onClose, onConfirmar }: { decisao: { d: DemandaAprovacao; tipo: string }; onClose: () => void; onConfirmar: (fd: FormData) => void }) {
  const [nota, setNota] = useState("");
  const titulos: Record<string, string> = { aprovar: "Aprovar demanda", rejeitar: "Rejeitar demanda", alteracoes: "Solicitar alterações", cancelar: "Cancelar aprovação" };
  const isCancelar = decisao.tipo === "cancelar";
  function confirmar() {
    const fd = new FormData();
    fd.set("demandaId", String(decisao.d.id));
    fd.set(isCancelar ? "motivo" : "nota", nota);
    onConfirmar(fd);
  }
  return (
    <ModalBase titulo={titulos[decisao.tipo]} onClose={onClose}>
      <div className="flex flex-col gap-3 p-5">
        <p className="text-sm text-gelo">{decisao.d.titulo}</p>
        <label className="flex flex-col gap-1">
          <span className={lbl}>{isCancelar ? "Motivo do cancelamento" : decisao.tipo === "alteracoes" ? "O que precisa mudar" : "Observação (opcional)"}</span>
          <textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={3} className={inputCls} />
        </label>
        {decisao.tipo === "alteracoes" && <p className="text-[11px] text-gelo-dim/60">A demanda volta para “Em andamento” e o histórico da rodada é preservado.</p>}
      </div>
      <div className="flex justify-end gap-2 border-t border-ink-line px-5 py-4">
        <button onClick={onClose} className="rounded-lg border border-ink-line px-4 py-2 text-sm text-gelo-dim hover:text-gelo">Voltar</button>
        <button onClick={confirmar} className="rounded-lg bg-roxo px-5 py-2 text-sm font-medium text-white hover:opacity-90">Confirmar</button>
      </div>
    </ModalBase>
  );
}

function HistoricoModal({ data, onClose }: { data: { d: DemandaAprovacao; itens: HistoricoItem[] }; onClose: () => void }) {
  const STATUS_TXT: Record<string, string> = { PENDING: "Enviada para aprovação", APPROVED: "Aprovada", CHANGES_REQUESTED: "Alterações solicitadas", REJECTED: "Rejeitada", REVOKED: "Aprovação cancelada" };
  return (
    <ModalBase titulo="Histórico de aprovação" onClose={onClose}>
      <div className="flex flex-col gap-3 p-5">
        <p className="text-sm text-gelo">{data.d.titulo}</p>
        {data.itens.length === 0 ? (
          <p className="text-xs text-gelo-dim">Sem registros ainda.</p>
        ) : (
          <ol className="flex flex-col gap-2">
            {data.itens.map((h) => (
              <li key={h.id} className="rounded-lg border border-ink-line bg-ink/40 p-2.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-gelo">Rodada {h.rodada} · {STATUS_TXT[h.status] ?? h.status}</span>
                  <span className="text-gelo-dim">{h.quando}</span>
                </div>
                <div className="mt-1 text-gelo-dim">
                  {h.approverType === "CLIENT"
                    ? <>Cliente <strong className="text-gelo">{h.approverLabel}</strong>{h.canal ? ` · ${h.canal}` : ""}{h.reportedBy ? ` · registrado por ${h.reportedBy}` : ""}</>
                    : h.approverLabel ? <>Por <strong className="text-gelo">{h.approverLabel}</strong></> : null}
                  {h.status === "REVOKED" && <> · cancelada por {h.revogadoPor}{h.motivoRevogacao ? ` (${h.motivoRevogacao})` : ""}</>}
                  {h.nota && <div className="mt-0.5 italic">“{h.nota}”</div>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </ModalBase>
  );
}
