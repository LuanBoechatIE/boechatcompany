"use client";

import { useEffect, useMemo, useState, useTransition, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
  Video,
  MapPin,
  X,
  Trash2,
  ExternalLink,
  Users,
  AlertTriangle,
} from "lucide-react";
import { ConexaoGoogle } from "./ConexaoGoogle";
import { EventoModal } from "./EventoModal";
import {
  getCalendarItems,
  excluirEvento,
  sincronizarAgora,
  type CalendarItem,
  type ConexaoView,
} from "@/app/admin/calendario-actions";

type Cliente = { id: number; nome: string };
type Projeto = { id: number; nome: string };
type Vista = "mes" | "semana" | "agenda";
const HORA_INI = 6;
const HORA_FIM = 22;
const HORA_PX = 44;

const KIND_COR: Record<CalendarItem["kind"], { dot: string; texto: string; label: string }> = {
  reuniao: { dot: "bg-roxo-light", texto: "text-roxo-light", label: "Reunião" },
  evento: { dot: "bg-sky-400", texto: "text-sky-300", label: "Evento" },
  demanda: { dot: "bg-amber-400", texto: "text-amber-300", label: "Demanda" },
  tarefa: { dot: "bg-violet-400", texto: "text-violet-300", label: "Tarefa" },
  prazo: { dot: "bg-red-400", texto: "text-red-300", label: "Prazo" },
};
const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DOW = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

function localKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function horaLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
function dataExtenso(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

export function CalendarioClient({
  itensIniciais,
  conexao,
  clientes,
  projetos,
  googleMsg,
}: {
  itensIniciais: CalendarItem[];
  conexao: ConexaoView;
  clientes: Cliente[];
  projetos: Projeto[];
  googleMsg?: string;
}) {
  const [vista, setVista] = useState<Vista>("mes");
  const [ref, setRef] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [itens, setItens] = useState<CalendarItem[]>(itensIniciais);
  const [, startFetch] = useTransition();
  const [modalData, setModalData] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState<CalendarItem | null>(null);
  const [toast, setToast] = useState<{ msg: string; erro?: boolean } | null>(null);
  const [fKind, setFKind] = useState("todos");
  const [fOrigem, setFOrigem] = useState("todos");
  const [fStatus, setFStatus] = useState("todos");

  const notificar = useCallback((msg: string, erro?: boolean) => {
    setToast({ msg, erro });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const grade = useMemo(() => {
    const monthStart = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const gridStart = new Date(monthStart);
    gridStart.setDate(1 - monthStart.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return d;
    });
  }, [ref]);

  const carregar = useCallback(() => {
    const from = grade[0];
    const to = new Date(grade[41]);
    to.setHours(23, 59, 59);
    startFetch(async () => {
      const res = await getCalendarItems(from.toISOString(), to.toISOString());
      setItens(res);
    });
  }, [grade]);

  useEffect(() => { carregar(); }, [carregar]);

  // Após conectar o Google, mostra aviso e sincroniza automaticamente.
  useEffect(() => {
    if (!googleMsg) return;
    const map: Record<string, string> = {
      conectado: "Google Agenda conectado.",
      cancelado: "Conexão cancelada.",
      estado_invalido: "Falha de segurança na conexão. Tente de novo.",
      nao_configurado: "Google Agenda não configurado.",
      falha: "Não foi possível conectar.",
    };
    notificar(map[googleMsg] ?? "", googleMsg !== "conectado");
    if (googleMsg === "conectado") {
      startFetch(async () => { await sincronizarAgora(); carregar(); });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtrados = useMemo(() => itens.filter((i) => {
    if (fKind !== "todos" && i.kind !== fKind) return false;
    if (fOrigem !== "todos" && i.source !== fOrigem) return false;
    if (fStatus === "concluido" && !i.concluido) return false;
    if (fStatus === "pendente" && i.concluido) return false;
    return true;
  }), [itens, fKind, fOrigem, fStatus]);

  const porDia = useMemo(() => {
    const m = new Map<string, CalendarItem[]>();
    for (const i of filtrados) {
      const k = localKey(new Date(i.startISO));
      m.set(k, [...(m.get(k) ?? []), i]);
    }
    return m;
  }, [filtrados]);

  function navegar(delta: number) {
    if (vista === "semana") {
      setRef((r) => { const d = new Date(r); d.setDate(r.getDate() + delta * 7); return d; });
    } else {
      setRef((r) => new Date(r.getFullYear(), r.getMonth() + delta, 1));
    }
  }
  const hojeKey = localKey(new Date());

  // Dias da semana atual (domingo a sábado que contém `ref`).
  const semana = useMemo(() => {
    const start = new Date(ref);
    start.setDate(ref.getDate() - ref.getDay());
    start.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  }, [ref]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl uppercase">Calendário</h1>
          <p className="mt-1 text-sm text-gelo-dim">Eventos, reuniões, demandas e prazos. Fuso: America/Sao_Paulo.</p>
        </div>
        <button onClick={() => setModalData(hojeKey)} className="flex items-center gap-2 rounded-full bg-roxo px-5 py-2.5 text-sm font-medium text-white shadow-[0_8px_30px_-8px_rgba(109,40,217,0.7)] hover:opacity-90">
          <Plus className="h-4 w-4" /> Novo evento
        </button>
      </div>

      <ConexaoGoogle view={conexao} onSynced={(m, e) => { notificar(m, e); carregar(); }} />

      {/* Cabeçalho de navegação */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setRef(new Date())} className="rounded-lg border border-ink-line bg-ink-soft/40 px-3 py-1.5 text-sm text-gelo-dim hover:text-gelo">Hoje</button>
          <button onClick={() => navegar(-1)} aria-label="Anterior" className="rounded-lg border border-ink-line bg-ink-soft/40 p-1.5 text-gelo-dim hover:text-gelo"><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={() => navegar(1)} aria-label="Próximo" className="rounded-lg border border-ink-line bg-ink-soft/40 p-1.5 text-gelo-dim hover:text-gelo"><ChevronRight className="h-4 w-4" /></button>
          <h2 className="ml-1 font-display text-xl uppercase text-gelo">
            {vista === "semana"
              ? `${semana[0].getDate()}/${semana[0].getMonth() + 1} – ${semana[6].getDate()}/${semana[6].getMonth() + 1}`
              : `${MESES[ref.getMonth()]} ${ref.getFullYear()}`}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-ink-line bg-ink-soft/40 p-0.5">
            {(["mes", "semana", "agenda"] as Vista[]).map((v) => (
              <button key={v} onClick={() => setVista(v)} className={`rounded-md px-3 py-1.5 text-sm ${vista === v ? "bg-roxo text-white" : "text-gelo-dim hover:text-gelo"}`}>
                {v === "mes" ? "Mês" : v === "semana" ? "Semana" : "Agenda"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <select value={fKind} onChange={(e) => setFKind(e.target.value)} className="rounded-lg border border-ink-line bg-ink-soft/40 px-3 py-1.5 text-gelo-dim">
          <option value="todos">Todos os tipos</option>
          <option value="reuniao">Reuniões</option>
          <option value="evento">Eventos</option>
          <option value="demanda">Demandas</option>
          <option value="tarefa">Tarefas</option>
          <option value="prazo">Prazos</option>
        </select>
        <select value={fOrigem} onChange={(e) => setFOrigem(e.target.value)} className="rounded-lg border border-ink-line bg-ink-soft/40 px-3 py-1.5 text-gelo-dim">
          <option value="todos">Todas as origens</option>
          <option value="boechat">Boechat</option>
          <option value="google">Google</option>
        </select>
        <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className="rounded-lg border border-ink-line bg-ink-soft/40 px-3 py-1.5 text-gelo-dim">
          <option value="todos">Todos os status</option>
          <option value="pendente">Pendentes</option>
          <option value="concluido">Concluídos</option>
        </select>
      </div>

      {vista === "mes" ? (
        <div className="overflow-hidden rounded-2xl border border-ink-line">
          <div className="grid grid-cols-7 border-b border-ink-line bg-ink-soft/40 text-center text-[11px] uppercase tracking-wide text-gelo-dim">
            {DOW.map((d) => <div key={d} className="py-2">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {grade.map((d, i) => {
              const k = localKey(d);
              const doMes = d.getMonth() === ref.getMonth();
              const eventos = porDia.get(k) ?? [];
              return (
                <button
                  key={i}
                  onClick={() => setModalData(k)}
                  className={`min-h-[104px] border-b border-r border-ink-line/60 p-1.5 text-left align-top transition-colors hover:bg-roxo/5 ${doMes ? "" : "opacity-40"}`}
                >
                  <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${k === hojeKey ? "bg-roxo text-white" : "text-gelo-dim"}`}>{d.getDate()}</span>
                  <div className="mt-1 flex flex-col gap-1">
                    {eventos.slice(0, 3).map((e) => (
                      <span
                        key={e.id}
                        onClick={(ev) => { ev.stopPropagation(); setDetalhe(e); }}
                        className={`flex items-center gap-1 truncate rounded px-1 py-0.5 text-[11px] ${e.concluido ? "opacity-50 line-through" : ""} ${e.atrasado ? "bg-red-500/10" : "bg-ink-soft/60"} hover:bg-ink-soft`}
                      >
                        <i className={`h-1.5 w-1.5 shrink-0 rounded-full ${KIND_COR[e.kind].dot}`} />
                        {!e.allDay && <span className="text-gelo-dim">{horaLabel(e.startISO)}</span>}
                        <span className="truncate text-gelo">{e.title}</span>
                      </span>
                    ))}
                    {eventos.length > 3 && <span className="px-1 text-[10px] text-gelo-dim">+{eventos.length - 3} mais</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : vista === "semana" ? (
        <SemanaView dias={semana} porDia={porDia} hojeKey={hojeKey} onItem={setDetalhe} onSlot={(k) => setModalData(k)} />
      ) : (
        <AgendaView itens={filtrados} onItem={setDetalhe} />
      )}

      {modalData && (
        <EventoModal
          open={!!modalData}
          onClose={() => setModalData(null)}
          onCreated={(m, e) => { notificar(m, e); carregar(); }}
          defaultDate={modalData}
          clientes={clientes}
          projetos={projetos}
          googleConectado={conexao.conectado && conexao.status === "conectado"}
        />
      )}

      {detalhe && <DetalheModal item={detalhe} onClose={() => setDetalhe(null)} onExcluir={(m, e) => { notificar(m, e); carregar(); }} />}

      {toast && (
        <div className={`fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-xl border px-4 py-2.5 text-sm shadow-xl ${toast.erro ? "border-red-500/40 bg-red-500/15 text-red-100" : "border-emerald-500/40 bg-emerald-500/15 text-emerald-100"}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function SemanaView({
  dias,
  porDia,
  hojeKey,
  onItem,
  onSlot,
}: {
  dias: Date[];
  porDia: Map<string, CalendarItem[]>;
  hojeKey: string;
  onItem: (i: CalendarItem) => void;
  onSlot: (dayKey: string) => void;
}) {
  const horas = Array.from({ length: HORA_FIM - HORA_INI + 1 }, (_, i) => HORA_INI + i);
  const alturaGrade = (HORA_FIM - HORA_INI) * HORA_PX;

  return (
    <div className="no-scrollbar overflow-x-auto rounded-2xl border border-ink-line">
      <div className="min-w-[720px]">
        {/* Cabeçalho dos dias */}
        <div className="grid border-b border-ink-line bg-ink-soft/40" style={{ gridTemplateColumns: `56px repeat(7, 1fr)` }}>
          <div />
          {dias.map((d) => {
            const k = localKey(d);
            return (
              <div key={k} className={`border-l border-ink-line/60 py-2 text-center text-[11px] uppercase tracking-wide ${k === hojeKey ? "text-roxo-light" : "text-gelo-dim"}`}>
                {DOW[d.getDay()]} <span className={`ml-1 ${k === hojeKey ? "rounded-full bg-roxo px-1.5 text-white" : "text-gelo"}`}>{d.getDate()}</span>
              </div>
            );
          })}
        </div>

        {/* Faixa de dia inteiro */}
        <div className="grid border-b border-ink-line/60" style={{ gridTemplateColumns: `56px repeat(7, 1fr)` }}>
          <div className="px-1 py-1 text-right text-[9px] uppercase text-gelo-dim/60">dia todo</div>
          {dias.map((d) => {
            const k = localKey(d);
            const allday = (porDia.get(k) ?? []).filter((e) => e.allDay);
            return (
              <div key={k} className="min-h-[26px] border-l border-ink-line/60 p-1">
                <div className="flex flex-col gap-0.5">
                  {allday.map((e) => (
                    <span key={e.id} onClick={() => onItem(e)} className={`flex cursor-pointer items-center gap-1 truncate rounded px-1 py-0.5 text-[10px] ${e.concluido ? "opacity-50 line-through" : ""} ${e.atrasado ? "bg-red-500/10" : "bg-ink-soft/60"}`}>
                      <i className={`h-1.5 w-1.5 shrink-0 rounded-full ${KIND_COR[e.kind].dot}`} />
                      <span className="truncate text-gelo">{e.title}</span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Grade de horários */}
        <div className="grid" style={{ gridTemplateColumns: `56px repeat(7, 1fr)` }}>
          {/* Coluna das horas */}
          <div>
            {horas.map((h) => (
              <div key={h} className="relative border-b border-ink-line/40 text-right" style={{ height: HORA_PX }}>
                <span className="absolute -top-2 right-1 text-[10px] text-gelo-dim/70">{String(h).padStart(2, "0")}:00</span>
              </div>
            ))}
          </div>
          {/* Colunas dos dias */}
          {dias.map((d) => {
            const k = localKey(d);
            const timed = (porDia.get(k) ?? []).filter((e) => !e.allDay);
            return (
              <div key={k} className="relative border-l border-ink-line/60" style={{ height: alturaGrade }}>
                {/* Linhas das horas (clicáveis pra criar) */}
                {horas.slice(0, -1).map((h) => (
                  <div key={h} onClick={() => onSlot(k)} className="border-b border-ink-line/40 hover:bg-roxo/5" style={{ height: HORA_PX }} />
                ))}
                {/* Eventos posicionados */}
                {timed.map((e) => {
                  const ini = new Date(e.startISO);
                  const fim = new Date(e.endISO);
                  const inicioH = ini.getHours() + ini.getMinutes() / 60;
                  const fimH = Math.max(fim.getHours() + fim.getMinutes() / 60, inicioH + 0.25);
                  const top = (Math.max(inicioH, HORA_INI) - HORA_INI) * HORA_PX;
                  const altura = Math.max((Math.min(fimH, HORA_FIM) - Math.max(inicioH, HORA_INI)) * HORA_PX, 18);
                  return (
                    <button
                      key={e.id}
                      onClick={(ev) => { ev.stopPropagation(); onItem(e); }}
                      className={`absolute left-0.5 right-0.5 overflow-hidden rounded-md border border-ink-line/60 px-1 text-left text-[10px] ${e.concluido ? "opacity-50" : ""}`}
                      style={{ top, height: altura, background: "rgba(33,26,49,0.9)" }}
                    >
                      <span className="flex items-center gap-1">
                        <i className={`h-1.5 w-1.5 shrink-0 rounded-full ${KIND_COR[e.kind].dot}`} />
                        <span className="truncate text-gelo">{horaLabel(e.startISO)} {e.title}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AgendaView({ itens, onItem }: { itens: CalendarItem[]; onItem: (i: CalendarItem) => void }) {
  const grupos = useMemo(() => {
    const m = new Map<string, CalendarItem[]>();
    for (const i of itens) {
      const k = localKey(new Date(i.startISO));
      m.set(k, [...(m.get(k) ?? []), i]);
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [itens]);

  if (grupos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-ink-line bg-ink-soft/20 p-14 text-center">
        <CalendarDays className="h-8 w-8 text-gelo-dim" />
        <p className="text-sm text-gelo-dim">Nada neste período.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-5">
      {grupos.map(([dia, lista]) => (
        <div key={dia}>
          <h3 className="mb-2 text-sm font-medium uppercase tracking-wide text-gelo">{dataExtenso(lista[0].startISO)}</h3>
          <ul className="flex flex-col gap-2">
            {lista.map((e) => (
              <li key={e.id}>
                <button onClick={() => onItem(e)} className="flex w-full items-center gap-3 rounded-xl border border-ink-line bg-ink-soft/30 p-3 text-left hover:border-roxo-light/40">
                  <i className={`h-2.5 w-2.5 shrink-0 rounded-full ${KIND_COR[e.kind].dot}`} />
                  <span className="w-16 shrink-0 text-xs text-gelo-dim">{e.allDay ? "Dia" : horaLabel(e.startISO)}</span>
                  <span className={`min-w-0 flex-1 truncate text-sm ${e.concluido ? "text-gelo-dim line-through" : "text-gelo"}`}>{e.title}</span>
                  {e.atrasado && <AlertTriangle className="h-4 w-4 text-red-400" />}
                  {e.clienteNome && <span className="hidden text-xs text-gelo-dim sm:inline">{e.clienteNome}</span>}
                  <span className={`rounded-full border border-ink-line px-2 py-0.5 text-[10px] uppercase ${KIND_COR[e.kind].texto}`}>{KIND_COR[e.kind].label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function DetalheModal({ item, onClose, onExcluir }: { item: CalendarItem; onClose: () => void; onExcluir: (m: string, e?: boolean) => void }) {
  const [excluindo, setExcluindo] = useState(false);
  const podeExcluir = item.eventoId != null;

  async function excluir() {
    if (!item.eventoId) return;
    if (!window.confirm("Excluir este evento? Os convidados serão notificados.")) return;
    setExcluindo(true);
    const r = await excluirEvento(item.eventoId);
    setExcluindo(false);
    onExcluir(r.ok ? "Evento excluído." : r.erro ?? "Falha.", !r.ok);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-ink-line bg-ink-soft shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-ink-line px-5 py-4">
          <div className="flex items-center gap-2">
            <i className={`h-2.5 w-2.5 rounded-full ${KIND_COR[item.kind].dot}`} />
            <h3 className="font-medium text-gelo">{item.title}</h3>
          </div>
          <button onClick={onClose} className="text-gelo-dim hover:text-gelo"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex flex-col gap-3 p-5 text-sm">
          <p className="text-gelo-dim">{dataExtenso(item.startISO)}{!item.allDay && ` · ${horaLabel(item.startISO)}–${horaLabel(item.endISO)}`}</p>
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full border border-ink-line px-2.5 py-0.5 text-[11px] uppercase ${KIND_COR[item.kind].texto}`}>{KIND_COR[item.kind].label}</span>
            <span className="rounded-full border border-ink-line px-2.5 py-0.5 text-[11px] uppercase text-gelo-dim">{item.source}</span>
            {item.atrasado && <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-[11px] uppercase text-red-300">Atrasado</span>}
            {item.prioridade && <span className="rounded-full border border-ink-line px-2.5 py-0.5 text-[11px] uppercase text-gelo-dim">{item.prioridade}</span>}
          </div>
          {item.clienteNome && <p className="text-gelo-dim">Cliente: <span className="text-gelo">{item.clienteNome}</span></p>}
          {item.responsavel && <p className="text-gelo-dim">Responsável: <span className="text-gelo">{item.responsavel}</span></p>}
          {item.location && <p className="flex items-center gap-1.5 text-gelo-dim"><MapPin className="h-3.5 w-3.5" /> {item.location}</p>}
          {item.description && <p className="whitespace-pre-wrap text-gelo-dim">{item.description}</p>}
          {item.meetLink && (
            <div className="flex flex-wrap gap-2">
              <a href={item.meetLink} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-lg border border-ink-line bg-ink px-3 py-1.5 text-xs text-gelo-dim hover:text-gelo"><Video className="h-3.5 w-3.5" /> Abrir Meet</a>
              <button onClick={() => { navigator.clipboard.writeText(item.meetLink!); }} className="rounded-lg border border-ink-line bg-ink px-3 py-1.5 text-xs text-gelo-dim hover:text-gelo">Copiar link</button>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-ink-line px-5 py-4">
          {item.href ? (
            <Link href={item.href} className="flex items-center gap-1.5 text-xs text-roxo-light hover:underline"><ExternalLink className="h-3.5 w-3.5" /> Abrir origem</Link>
          ) : <span />}
          {podeExcluir && (
            <button onClick={excluir} disabled={excluindo} className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-ink px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-50">
              <Trash2 className="h-3.5 w-3.5" /> {excluindo ? "Excluindo…" : "Excluir"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
