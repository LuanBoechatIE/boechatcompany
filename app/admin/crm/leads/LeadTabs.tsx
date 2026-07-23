"use client";

// Abas reutilizáveis do lead (edição, timeline, checklist, arquivos) + controles
// de score/prioridade e follow-up. Compartilhadas pelo modal central de
// atendimento (Sales OS).
import { useRef, useState, useTransition } from "react";
import { upload } from "@vercel/blob/client";
import {
  StickyNote,
  ListChecks,
  History,
  Check,
  Phone,
  MessageCircle,
  Mail,
  Users,
  MapPin,
  FileText,
  MessageSquare,
  Activity,
  CalendarClock,
  Paperclip,
  Loader2,
  Plus,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import {
  LEAD_PRIORIDADES,
  ORIGENS_LEAD,
  SERVICOS,
  type LeadDTO,
  type AtividadeDTO,
  type ChecklistDTO,
  type ArquivoDTO,
} from "@/app/lib/crm/types";
import { ResponsavelSelect } from "./ResponsavelSelect";
import {
  updateLead,
  addAtividade,
  toggleAtividade,
  deleteAtividade,
  setLeadPrioridade,
  setLeadScoreFixo,
  updateFollowUp,
  addChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
  addLeadArquivo,
  deleteLeadArquivo,
} from "../../crm-actions";

export const inputCls =
  "w-full rounded-xl border border-ink-line bg-ink p-2.5 text-sm outline-none focus:border-roxo-light/60";
export const labelCls = "text-xs text-gelo-dim";

export const TEMP_TEXT: Record<string, string> = {
  quente: "text-emerald-300",
  morno: "text-yellow-300",
  frio: "text-slate-300",
};

const ATIV_ICON: Record<string, LucideIcon> = {
  nota: StickyNote,
  tarefa: ListChecks,
  ligacao: Phone,
  whatsapp: MessageCircle,
  email: Mail,
  reuniao: Users,
  mensagem: MessageSquare,
  visita: MapPin,
  proposta: FileText,
  evento: Activity,
  auditoria: History,
  followup: CalendarClock,
  outro: MessageSquare,
};

const ATIV_COR: Record<string, string> = {
  ligacao: "text-sky-300",
  whatsapp: "text-emerald-300",
  email: "text-indigo-300",
  reuniao: "text-fuchsia-300",
  proposta: "text-yellow-300",
  visita: "text-cyan-300",
  evento: "text-roxo-light",
  followup: "text-sky-300",
  auditoria: "text-gelo-dim/60",
};

const QUICK_LOG: { tipo: string; label: string; icon: LucideIcon }[] = [
  { tipo: "ligacao", label: "Ligação", icon: Phone },
  { tipo: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { tipo: "email", label: "E-mail", icon: Mail },
  { tipo: "reuniao", label: "Reunião", icon: Users },
  { tipo: "proposta", label: "Proposta", icon: FileText },
  { tipo: "visita", label: "Visita", icon: MapPin },
];

const hora = (ms: number) =>
  new Date(ms).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

// ── Score + prioridade ───────────────────────────────────────────────────────
export function ScorePrioridade({ lead }: { lead: LeadDTO }) {
  const [pending, start] = useTransition();
  const [fixOpen, setFixOpen] = useState(false);
  const [scoreVal, setScoreVal] = useState(String(lead.leadScore));

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-ink-line bg-ink/40 px-4 py-2.5">
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-wide text-gelo-dim">Score</span>
        <div className="flex items-center gap-2">
          <span className={`font-display text-xl leading-none ${TEMP_TEXT[lead.temperatura]}`}>{lead.leadScore}</span>
          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-ink-line">
            <span
              className={`block h-full rounded-full ${
                lead.temperatura === "quente" ? "bg-emerald-400" : lead.temperatura === "morno" ? "bg-yellow-400" : "bg-slate-400"
              }`}
              style={{ width: `${lead.leadScore}%` }}
            />
          </span>
          <button onClick={() => setFixOpen((v) => !v)} className="text-[10px] text-gelo-dim underline decoration-dotted hover:text-gelo">
            {lead.scoreFixo != null ? "fixo" : "auto"}
          </button>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <span className="text-[10px] uppercase tracking-wide text-gelo-dim">Prioridade</span>
        {LEAD_PRIORIDADES.map((p) => (
          <button
            key={p.key}
            disabled={pending}
            onClick={() => start(() => setLeadPrioridade(lead.id, p.key))}
            title={p.label}
            className={`flex h-6 w-6 items-center justify-center rounded-lg border transition-colors ${
              lead.prioridade === p.key ? "border-roxo-light/60 bg-roxo/15" : "border-ink-line hover:border-roxo-light/40"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${p.dot}`} />
          </button>
        ))}
      </div>

      {fixOpen && (
        <div className="flex w-full items-center gap-2 rounded-lg border border-ink-line bg-ink p-2">
          <input
            type="number" min={0} max={100} value={scoreVal}
            onChange={(e) => setScoreVal(e.target.value)}
            className="w-20 rounded-md border border-ink-line bg-ink-soft px-2 py-1 text-sm outline-none"
          />
          <button onClick={() => start(() => setLeadScoreFixo(lead.id, Number(scoreVal)))} className="rounded-md bg-roxo px-3 py-1 text-xs text-white">Fixar nota</button>
          <button onClick={() => start(() => setLeadScoreFixo(lead.id, null))} className="rounded-md border border-ink-line px-3 py-1 text-xs text-gelo-dim hover:text-gelo">Voltar ao automático</button>
        </div>
      )}
    </div>
  );
}

// ── Follow-up ────────────────────────────────────────────────────────────────
export function FollowUpBar({ lead }: { lead: LeadDTO }) {
  const cor =
    lead.followUpStatus === "atrasado"
      ? "border-red-500/30 bg-red-500/5"
      : lead.followUpStatus === "hoje"
        ? "border-sky-500/30 bg-sky-500/5"
        : "border-ink-line bg-ink/40";
  return (
    <form action={updateFollowUp} className={`flex flex-wrap items-end gap-2 rounded-xl border px-4 py-3 ${cor}`}>
      <input type="hidden" name="id" value={lead.id} />
      <CalendarClock className="mb-2.5 h-4 w-4 text-gelo-dim" />
      <label className="flex min-w-[8rem] flex-1 flex-col gap-1">
        <span className={labelCls}>Próxima ação</span>
        <input name="proximaAcao" defaultValue={lead.proximaAcao} placeholder="Ligar, enviar proposta..." className={inputCls} />
      </label>
      <label className="flex flex-col gap-1">
        <span className={labelCls}>Data</span>
        <input name="proximoContato" type="date" defaultValue={lead.proximoContatoInput} className={inputCls} />
      </label>
      <label className="flex flex-col gap-1">
        <span className={labelCls}>Resp.</span>
        <ResponsavelSelect
          name="proximoContatoResponsavel"
          defaultValue={lead.proximoContatoResponsavel}
          submitAs="nome"
          className={inputCls}
        />
      </label>
      <button className="rounded-lg bg-roxo px-4 py-2.5 text-xs font-medium text-white">Agendar</button>
    </form>
  );
}

// ── Editar (dados completos) ─────────────────────────────────────────────────
export function ResumoForm({ lead, podeReatribuir = true }: { lead: LeadDTO; podeReatribuir?: boolean }) {
  return (
    <form action={updateLead} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={lead.id} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1"><span className={labelCls}>Nome / lead</span><input name="nome" defaultValue={lead.nome} className={inputCls} /></label>
        <label className="flex flex-col gap-1"><span className={labelCls}>Empresa</span><input name="empresa" defaultValue={lead.empresa} className={inputCls} /></label>
        <label className="flex flex-col gap-1"><span className={labelCls}>Pessoa de contato</span><input name="pessoaContato" defaultValue={lead.pessoaContato} className={inputCls} /></label>
        <label className="flex flex-col gap-1"><span className={labelCls}>Telefone</span><input name="telefone" defaultValue={lead.telefone} className={inputCls} /></label>
        <label className="flex flex-col gap-1"><span className={labelCls}>WhatsApp</span><input name="whatsapp" defaultValue={lead.whatsapp} className={inputCls} /></label>
        <label className="flex flex-col gap-1"><span className={labelCls}>E-mail</span><input name="email" type="email" defaultValue={lead.email} className={inputCls} /></label>
        <label className="flex flex-col gap-1">
          <span className={labelCls}>Serviço de interesse</span>
          <select name="servico" defaultValue={lead.servico} className={inputCls}><option value="">—</option>{SERVICOS.map((s) => <option key={s} value={s}>{s}</option>)}</select>
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelCls}>Origem</span>
          <select name="origem" defaultValue={lead.origem} className={inputCls}><option value="">—</option>{ORIGENS_LEAD.map((o) => <option key={o} value={o}>{o}</option>)}</select>
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelCls}>Responsável</span>
          {podeReatribuir ? (
            <ResponsavelSelect
              name="responsavelUsuarioId"
              defaultValue={lead.usuarioId}
              submitAs="id"
              className={inputCls}
            />
          ) : (
            <input
              value={lead.responsavel || "Sem responsável"}
              disabled
              title="Só Diretor Comercial/Dono pode reatribuir o responsável"
              className={`${inputCls} cursor-not-allowed opacity-60`}
            />
          )}
        </label>
        <label className="flex flex-col gap-1"><span className={labelCls}>Valor estimado (R$)</span><input name="valorEstimado" defaultValue={lead.valorEstimado ?? ""} placeholder="0,00" className={inputCls} /></label>
        <label className="flex flex-col gap-1">
          <span className={labelCls}>Prioridade</span>
          <select name="prioridade" defaultValue={lead.prioridade} className={inputCls}>{LEAD_PRIORIDADES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}</select>
        </label>
      </div>
      <label className="flex flex-col gap-1"><span className={labelCls}>Tags (separadas por vírgula)</span><input name="tags" defaultValue={lead.tags} className={inputCls} /></label>
      <label className="flex flex-col gap-1"><span className={labelCls}>Observações</span><textarea name="observacoes" rows={3} defaultValue={lead.observacoes} className={inputCls} /></label>
      <button className="self-start rounded-full bg-roxo px-6 py-2.5 text-sm font-medium text-white">Salvar alterações</button>
    </form>
  );
}

// ── Timeline + registro manual ───────────────────────────────────────────────
export function TimelineTab({ lead, atividades }: { lead: LeadDTO; atividades: AtividadeDTO[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [logTipo, setLogTipo] = useState<string>("nota");
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-ink-line bg-ink p-4">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {QUICK_LOG.map((q) => {
            const Icon = q.icon;
            const ativo = logTipo === q.tipo;
            return (
              <button
                key={q.tipo}
                onClick={() => setLogTipo(ativo ? "nota" : q.tipo)}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                  ativo ? "border-roxo-light/60 bg-roxo/15 text-gelo" : "border-ink-line text-gelo-dim hover:text-gelo"
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {q.label}
              </button>
            );
          })}
        </div>
        <form ref={formRef} action={async (fd) => { await addAtividade(fd); formRef.current?.reset(); }} className="flex flex-col gap-2">
          <input type="hidden" name="leadId" value={lead.id} />
          <textarea name="texto" required rows={2} placeholder="Nota rápida, tarefa ou registro..." className={inputCls} />
          <div className="flex flex-wrap items-center gap-2">
            <select name="tipo" value={logTipo} onChange={(e) => setLogTipo(e.target.value)} className="rounded-lg border border-ink-line bg-ink px-3 py-2 text-xs text-gelo-dim">
              <option value="nota">Nota</option>
              <option value="tarefa">Tarefa</option>
              {QUICK_LOG.map((q) => <option key={q.tipo} value={q.tipo}>{q.label}</option>)}
              <option value="outro">Outro</option>
            </select>
            <input name="data" type="date" title="Prazo (para tarefas)" className="rounded-lg border border-ink-line bg-ink px-3 py-2 text-xs text-gelo-dim" />
            <button className="ml-auto rounded-full bg-roxo px-5 py-2 text-xs font-medium text-white">Registrar</button>
          </div>
        </form>
      </div>

      {atividades.length === 0 ? (
        <p className="py-6 text-center text-sm text-gelo-dim/60">Nenhuma atividade ainda.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {atividades.map((a) => {
            const Icon = ATIV_ICON[a.tipo] ?? StickyNote;
            const cor = ATIV_COR[a.tipo] ?? "text-gelo-dim";
            return (
              <li key={a.id} className="flex items-start gap-3 rounded-xl border border-ink-line bg-ink p-3">
                {a.tipo === "tarefa" ? (
                  <form action={toggleAtividade}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="feito" value={String(a.feito)} />
                    <button className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded border ${a.feito ? "border-emerald-500 bg-emerald-500/20 text-emerald-400" : "border-ink-line text-transparent hover:border-roxo-light"}`} aria-label="Concluir tarefa">
                      <Check className="h-3 w-3" />
                    </button>
                  </form>
                ) : (
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${cor}`} />
                )}
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${a.feito ? "text-gelo-dim line-through" : "text-gelo"}`}>{a.texto}</p>
                  {a.tipo === "auditoria" && (a.valorAnterior || a.valorNovo) && (
                    <p className="mt-0.5 text-[11px] text-gelo-dim">
                      <span className="text-red-300/70 line-through">{a.valorAnterior || "vazio"}</span>{" → "}
                      <span className="text-emerald-300/80">{a.valorNovo || "vazio"}</span>
                    </p>
                  )}
                  <p className="mt-0.5 text-[10px] text-gelo-dim/60">
                    {a.criadoEmLabel} · {hora(a.criadoEmMs)}{a.autor ? ` · ${a.autor}` : ""}{a.dataLabel ? ` · prazo ${a.dataLabel}` : ""}
                  </p>
                </div>
                <form action={deleteAtividade}>
                  <input type="hidden" name="id" value={a.id} />
                  <button className="rounded-md p-1 text-red-300/40 hover:text-red-300" aria-label="Excluir"><Trash2 className="h-3.5 w-3.5" /></button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ── Checklist ────────────────────────────────────────────────────────────────
export function ChecklistTab({ lead, checklist }: { lead: LeadDTO; checklist: ChecklistDTO[] }) {
  const [, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const feitos = checklist.filter((c) => c.feito).length;
  const pct = checklist.length > 0 ? Math.round((feitos / checklist.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      {checklist.length > 0 && (
        <div>
          <div className="mb-1 flex justify-between text-[11px] text-gelo-dim"><span>{feitos} de {checklist.length} concluídos</span><span>{pct}%</span></div>
          <span className="block h-1.5 overflow-hidden rounded-full bg-ink-line"><span className="block h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${pct}%` }} /></span>
        </div>
      )}
      <form ref={formRef} action={async (fd) => { await addChecklistItem(fd); formRef.current?.reset(); }} className="flex items-center gap-2">
        <input type="hidden" name="leadId" value={lead.id} />
        <input name="texto" required placeholder="Novo item do checklist..." className={inputCls} />
        <button className="shrink-0 rounded-lg bg-roxo p-2.5 text-white" aria-label="Adicionar"><Plus className="h-4 w-4" /></button>
      </form>
      {checklist.length === 0 ? (
        <p className="py-6 text-center text-sm text-gelo-dim/60">Nenhum item ainda.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {checklist.map((c) => (
            <li key={c.id} className="flex items-center gap-3 rounded-xl border border-ink-line bg-ink p-3">
              <button onClick={() => start(() => toggleChecklistItem(c.id, c.feito))} className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${c.feito ? "border-emerald-500 bg-emerald-500/20 text-emerald-400" : "border-ink-line text-transparent hover:border-roxo-light"}`} aria-label="Concluir item">
                <Check className="h-3 w-3" />
              </button>
              <span className={`flex-1 text-sm ${c.feito ? "text-gelo-dim line-through" : "text-gelo"}`}>{c.texto}</span>
              <button onClick={() => start(() => deleteChecklistItem(c.id))} className="rounded-md p-1 text-red-300/40 hover:text-red-300" aria-label="Excluir"><Trash2 className="h-3.5 w-3.5" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Arquivos ─────────────────────────────────────────────────────────────────
export function ArquivosTab({ lead, arquivos }: { lead: LeadDTO; arquivos: ArquivoDTO[] }) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  async function selecionar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setErro(null);
    if (file.size > 10 * 1024 * 1024) { setErro("Arquivo acima de 10 MB."); return; }
    setEnviando(true);
    try {
      const blob = await upload(file.name, file, { access: "public", handleUploadUrl: "/admin/api/upload-lead" });
      start(() => addLeadArquivo(lead.id, file.name, blob.url, file.size));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha no upload.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <button onClick={() => inputRef.current?.click()} disabled={enviando} className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-ink-line bg-ink py-6 text-sm text-gelo-dim hover:border-roxo-light/50 hover:text-gelo disabled:opacity-50">
        {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
        {enviando ? "Enviando..." : "Anexar arquivo (até 10 MB)"}
      </button>
      <input ref={inputRef} type="file" onChange={selecionar} className="hidden" />
      {erro && <p className="text-xs text-red-300">{erro}</p>}
      {arquivos.length === 0 ? (
        <p className="py-6 text-center text-sm text-gelo-dim/60">Nenhum arquivo anexado.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {arquivos.map((a) => (
            <li key={a.id} className="flex items-center gap-3 rounded-xl border border-ink-line bg-ink p-3">
              <FileText className="h-4 w-4 shrink-0 text-gelo-dim" />
              <a href={a.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1">
                <p className="truncate text-sm text-gelo hover:text-roxo-light">{a.nome}</p>
                <p className="text-[10px] text-gelo-dim/60">{a.tamanhoLabel}{a.autor ? ` · ${a.autor}` : ""} · {a.criadoEmLabel}</p>
              </a>
              <button onClick={() => start(() => deleteLeadArquivo(a.id))} className="rounded-md p-1 text-red-300/40 hover:text-red-300" aria-label="Excluir"><Trash2 className="h-3.5 w-3.5" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
