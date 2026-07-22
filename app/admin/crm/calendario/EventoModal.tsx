"use client";

import { useEffect, useState } from "react";
import { X, Plus, Video, Users, Loader2 } from "lucide-react";
import { criarEvento, type NovoEventoInput } from "@/app/admin/calendario-actions";

const EQUIPE = [
  { nome: "Samuel", email: "Samuelfborgesaguiar@gmail.com" },
  { nome: "Luan", email: "luanredminote11@gmail.com" },
];

const RECORRENCIA: { key: string; label: string; rrule: string }[] = [
  { key: "nao", label: "Não repetir", rrule: "" },
  { key: "diario", label: "Todos os dias", rrule: "RRULE:FREQ=DAILY" },
  { key: "semanal", label: "Toda semana", rrule: "RRULE:FREQ=WEEKLY" },
  { key: "mensal", label: "Todo mês", rrule: "RRULE:FREQ=MONTHLY" },
  { key: "anual", label: "Todo ano", rrule: "RRULE:FREQ=YEARLY" },
];

const LEMBRETES = [
  { min: 10, label: "10 min" },
  { min: 30, label: "30 min" },
  { min: 60, label: "1 hora" },
  { min: 1440, label: "1 dia" },
];

const inputCls =
  "w-full rounded-xl border border-ink-line bg-ink p-2.5 text-sm text-gelo outline-none focus:border-roxo-light/60";
const lbl = "text-xs text-gelo-dim";

type Attendee = { email: string; optional: boolean };
type Cliente = { id: number; nome: string };
type Projeto = { id: number; nome: string };

function toISO(date: string, time: string): string {
  return `${date}T${time}:00-03:00`; // America/Sao_Paulo (UTC-3, sem horário de verão)
}
function proximoDia(date: string): string {
  const d = new Date(date + "T12:00:00");
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function EventoModal({
  open,
  onClose,
  onCreated,
  defaultDate,
  clientes,
  projetos,
  googleConectado,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (msg: string, erro?: boolean) => void;
  defaultDate: string; // YYYY-MM-DD
  clientes: Cliente[];
  projetos: Projeto[];
  googleConectado: boolean;
}) {
  const [type, setType] = useState<NovoEventoInput["type"]>("reuniao");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [projetoId, setProjetoId] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [dataIni, setDataIni] = useState(defaultDate);
  const [horaIni, setHoraIni] = useState("09:00");
  const [dataFim, setDataFim] = useState(defaultDate);
  const [horaFim, setHoraFim] = useState("10:00");
  const [location, setLocation] = useState("");
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [novoEmail, setNovoEmail] = useState("");
  const [recorrencia, setRecorrencia] = useState("nao");
  const [lembretes, setLembretes] = useState<number[]>([30]);
  const [criarMeet, setCriarMeet] = useState(true);
  const [enviarConvites, setEnviarConvites] = useState(true);
  const [sincronizar, setSincronizar] = useState(googleConectado);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDataIni(defaultDate);
      setDataFim(defaultDate);
      setErro(null);
    }
  }, [open, defaultDate]);

  const ehReuniao = type === "reuniao";

  function addEmail(email: string) {
    const e = email.trim().toLowerCase();
    if (!e || attendees.some((a) => a.email.toLowerCase() === e)) return;
    setAttendees((prev) => [...prev, { email: e, optional: false }]);
    setNovoEmail("");
  }

  async function salvar() {
    setErro(null);
    if (!title.trim()) {
      setErro("Informe um título.");
      return;
    }
    const startISO = allDay ? toISO(dataIni, "00:00") : toISO(dataIni, horaIni);
    const endISO = allDay ? toISO(proximoDia(dataFim), "00:00") : toISO(dataFim, horaFim);
    if (new Date(startISO) > new Date(endISO)) {
      setErro("O início deve ser antes do fim.");
      return;
    }

    setSalvando(true);
    const r = await criarEvento({
      type,
      title: title.trim(),
      description,
      clienteId: clienteId ? Number(clienteId) : null,
      projetoId: projetoId ? Number(projetoId) : null,
      allDay,
      startISO,
      endISO,
      location,
      attendees,
      recurrenceRule: RECORRENCIA.find((r) => r.key === recorrencia)?.rrule || undefined,
      reminders: lembretes,
      criarMeet: ehReuniao && criarMeet,
      sincronizarGoogle: sincronizar,
      enviarConvites,
    });
    setSalvando(false);

    if (!r.ok) {
      setErro(r.erro ?? "Falha ao criar.");
      return;
    }
    let msg = "Evento criado.";
    if (r.meetLink) msg = "Reunião criada com Google Meet.";
    else if (r.meetPendente) msg = "Evento criado. O Meet está sendo gerado, sincronize em instantes.";
    else if (r.erro) msg = r.erro;
    onCreated(msg, false);
    // reset leve
    setTitle("");
    setDescription("");
    setAttendees([]);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-2xl rounded-2xl border border-ink-line bg-ink-soft shadow-2xl">
        <div className="flex items-center justify-between border-b border-ink-line px-5 py-4">
          <h3 className="font-display text-lg uppercase text-gelo">Novo item</h3>
          <button onClick={onClose} className="text-gelo-dim hover:text-gelo"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          {/* Tipo */}
          <div className="flex flex-wrap gap-2">
            {(["reuniao", "evento", "demanda", "tarefa"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setType(t);
                  if (t === "reuniao") { setCriarMeet(true); setEnviarConvites(true); }
                }}
                className={`rounded-full border px-4 py-1.5 text-sm capitalize transition-colors ${
                  type === t ? "border-roxo-light bg-roxo/20 text-gelo" : "border-ink-line text-gelo-dim hover:text-gelo"
                }`}
              >
                {t === "reuniao" ? "Reunião" : t}
              </button>
            ))}
          </div>

          <label className="flex flex-col gap-1">
            <span className={lbl}>Título</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="Ex.: Reunião de alinhamento" />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className={lbl}>Cliente</span>
              <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className={inputCls}>
                <option value="">—</option>
                {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className={lbl}>Projeto</span>
              <select value={projetoId} onChange={(e) => setProjetoId(e.target.value)} className={inputCls}>
                <option value="">—</option>
                {projetos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm text-gelo-dim">
            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} /> Dia inteiro
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className={lbl}>Início</span>
              <div className="flex gap-2">
                <input type="date" value={dataIni} onChange={(e) => setDataIni(e.target.value)} className={inputCls} />
                {!allDay && <input type="time" value={horaIni} onChange={(e) => setHoraIni(e.target.value)} className={inputCls} />}
              </div>
            </label>
            <label className="flex flex-col gap-1">
              <span className={lbl}>Fim</span>
              <div className="flex gap-2">
                <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className={inputCls} />
                {!allDay && <input type="time" value={horaFim} onChange={(e) => setHoraFim(e.target.value)} className={inputCls} />}
              </div>
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className={lbl}>Descrição</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputCls} />
          </label>

          <label className="flex flex-col gap-1">
            <span className={lbl}>Localização</span>
            <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} placeholder="Endereço ou link" />
          </label>

          {/* Convidados */}
          <div className="flex flex-col gap-2">
            <span className={`${lbl} flex items-center gap-1.5`}><Users className="h-3.5 w-3.5" /> Convidados</span>
            <div className="flex flex-wrap gap-2">
              {EQUIPE.map((m) => (
                <button key={m.email} onClick={() => addEmail(m.email)} className="rounded-full border border-ink-line bg-ink px-3 py-1 text-xs text-gelo-dim hover:border-roxo-light/50 hover:text-gelo">
                  + {m.nome}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={novoEmail}
                onChange={(e) => setNovoEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addEmail(novoEmail); } }}
                placeholder="e-mail@exemplo.com"
                className={inputCls}
              />
              <button onClick={() => addEmail(novoEmail)} className="rounded-xl border border-ink-line bg-ink px-3 text-gelo-dim hover:text-gelo"><Plus className="h-4 w-4" /></button>
            </div>
            {attendees.length > 0 && (
              <ul className="flex flex-col gap-1">
                {attendees.map((a) => (
                  <li key={a.email} className="flex items-center gap-2 rounded-lg border border-ink-line bg-ink px-3 py-1.5 text-sm">
                    <span className="flex-1 truncate text-gelo">{a.email}</span>
                    <label className="flex items-center gap-1 text-[11px] text-gelo-dim">
                      <input type="checkbox" checked={a.optional} onChange={(e) => setAttendees((prev) => prev.map((x) => x.email === a.email ? { ...x, optional: e.target.checked } : x))} /> opcional
                    </label>
                    <button onClick={() => setAttendees((prev) => prev.filter((x) => x.email !== a.email))} className="text-gelo-dim hover:text-red-300"><X className="h-3.5 w-3.5" /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Recorrência + lembretes */}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className={lbl}>Recorrência</span>
              <select value={recorrencia} onChange={(e) => setRecorrencia(e.target.value)} className={inputCls}>
                {RECORRENCIA.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select>
            </label>
            <div className="flex flex-col gap-1">
              <span className={lbl}>Lembretes</span>
              <div className="flex flex-wrap gap-2 pt-1">
                {LEMBRETES.map((l) => {
                  const on = lembretes.includes(l.min);
                  return (
                    <button key={l.min} onClick={() => setLembretes((prev) => on ? prev.filter((m) => m !== l.min) : [...prev, l.min])}
                      className={`rounded-full border px-3 py-1 text-xs ${on ? "border-roxo-light bg-roxo/20 text-gelo" : "border-ink-line text-gelo-dim"}`}>
                      {l.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Opções de reunião / sync */}
          <div className="flex flex-col gap-2 rounded-xl border border-ink-line bg-ink/50 p-3">
            {ehReuniao && (
              <label className="flex items-center gap-2 text-sm text-gelo-dim">
                <input type="checkbox" checked={criarMeet} onChange={(e) => setCriarMeet(e.target.checked)} />
                <Video className="h-3.5 w-3.5" /> Gerar sala do Google Meet
              </label>
            )}
            <label className="flex items-center gap-2 text-sm text-gelo-dim">
              <input type="checkbox" checked={enviarConvites} onChange={(e) => setEnviarConvites(e.target.checked)} /> Enviar convites por e-mail
            </label>
            <label className={`flex items-center gap-2 text-sm ${googleConectado ? "text-gelo-dim" : "text-gelo-dim/40"}`}>
              <input type="checkbox" checked={sincronizar} disabled={!googleConectado} onChange={(e) => setSincronizar(e.target.checked)} />
              Sincronizar com o Google Agenda {!googleConectado && "(conta não conectada)"}
            </label>
          </div>

          {erro && <p className="text-sm text-red-300">{erro}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-ink-line px-5 py-4">
          <button onClick={onClose} className="rounded-lg border border-ink-line px-4 py-2 text-sm text-gelo-dim hover:text-gelo">Cancelar</button>
          <button onClick={salvar} disabled={salvando} className="flex items-center gap-2 rounded-lg bg-roxo px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
            {salvando ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando…</> : "Criar"}
          </button>
        </div>
      </div>
    </div>
  );
}
