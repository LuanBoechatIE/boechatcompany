"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Phone,
  MessageCircle,
  Check,
  X,
  ArrowRight,
  CalendarCheck,
  Ban,
  Loader2,
  ChevronRight,
  UserPlus,
} from "lucide-react";
import {
  MOTIVOS_ENCERRAMENTO,
  type LeadDTO,
  type ResultadoAtendimento,
} from "@/app/lib/crm/types";
import {
  registrarResultado,
  listUsuariosAtivos,
  reagendarReuniao,
  cancelarReuniao,
  type UsuarioBasico,
} from "../../crm-actions";
import { getEventoAttendees, type ParticipanteView } from "../../calendario-actions";
import { linkWhatsapp, mensagemAbordagemInicial } from "@/app/lib/whatsapp";

type Etapa =
  | "inicio"
  | "atendeu"
  | "decisor"
  | "gatekeeper"
  | "interesse"
  | "motivo"
  | "reuniao"
  | "reuniao_form"
  | "reuniao_resumo"
  | "proxima"
  | "whatsapp_resp"
  | "encerrar"
  | "encerrado"
  | "sucesso";

type Participante = { usuarioId: number; nome: string; email: string; funcao: string };

// Deriva a tela inicial a partir da fase atual do lead no Kanban — reabrir um
// lead nunca começa do zero.
function estadoInicialPara(lead: LeadDTO): Etapa {
  if (lead.status === "convertido" || lead.status === "perdido") return "encerrado";
  if (lead.status === "reuniao_agendada") return "reuniao_resumo";
  if (lead.status === "qualificado") return "reuniao";
  return "inicio";
}

function toDatetimeLocal(ms: number | null): string {
  if (!ms) return "";
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const btnGrande =
  "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-4 text-base font-medium transition-colors";
const btnPrimario = `${btnGrande} bg-roxo text-white hover:opacity-90`;
const btnNeutro = `${btnGrande} border border-ink-line bg-ink text-gelo hover:border-roxo-light/50`;

function SimNao({ onSim, onNao, simLabel = "Sim", naoLabel = "Não" }: {
  onSim: () => void;
  onNao: () => void;
  simLabel?: string;
  naoLabel?: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button onClick={onSim} className={`${btnGrande} border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20`}>
        <Check className="h-5 w-5" /> {simLabel}
      </button>
      <button onClick={onNao} className={`${btnGrande} border border-ink-line bg-ink text-gelo-dim hover:border-red-500/40 hover:text-red-200`}>
        <X className="h-5 w-5" /> {naoLabel}
      </button>
    </div>
  );
}

function ParticipantesPicker({
  usuarios,
  selecionados,
  onChange,
}: {
  usuarios: UsuarioBasico[];
  selecionados: Participante[];
  onChange: (next: Participante[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const disponiveis = usuarios.filter((u) => !selecionados.some((s) => s.usuarioId === u.id));

  return (
    <div className="flex flex-col gap-2">
      <span className={labelCls}>Participantes (equipe)</span>
      {selecionados.map((s) => (
        <div key={s.usuarioId} className="flex items-center gap-2 rounded-lg border border-ink-line bg-ink p-2">
          <span className="min-w-0 flex-1 truncate text-sm text-gelo">{s.nome}</span>
          <input
            value={s.funcao}
            onChange={(e) =>
              onChange(selecionados.map((p) => (p.usuarioId === s.usuarioId ? { ...p, funcao: e.target.value } : p)))
            }
            placeholder="Função (ex.: vendedor)"
            className="w-36 shrink-0 rounded-md border border-ink-line bg-ink-soft px-2 py-1 text-xs outline-none focus:border-roxo-light/50"
          />
          <button
            onClick={() => onChange(selecionados.filter((p) => p.usuarioId !== s.usuarioId))}
            className="text-red-300/60 hover:text-red-300"
            aria-label="Remover"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-dashed border-ink-line px-3 py-2 text-xs text-gelo-dim hover:border-roxo-light/40 hover:text-gelo"
        >
          <UserPlus className="h-3.5 w-3.5" /> Adicionar participante
        </button>
        {open && (
          <div className="absolute left-0 top-full z-10 mt-1 max-h-48 w-56 overflow-y-auto rounded-lg border border-ink-line bg-ink-soft shadow-xl">
            {disponiveis.length === 0 ? (
              <p className="p-3 text-xs text-gelo-dim/60">
                {usuarios.length === 0 ? "Carregando usuários..." : "Todos já adicionados."}
              </p>
            ) : (
              disponiveis.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    onChange([...selecionados, { usuarioId: u.id, nome: u.nome, email: u.email, funcao: "" }]);
                    setOpen(false);
                  }}
                  className="block w-full px-3 py-2 text-left text-sm text-gelo-dim hover:bg-ink hover:text-gelo"
                >
                  {u.nome}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const pergunta = "text-center text-lg font-medium text-gelo";
const inputCls = "w-full rounded-xl border border-ink-line bg-ink p-2.5 text-sm outline-none focus:border-roxo-light/60";
const labelCls = "text-xs text-gelo-dim";

export function FluxoAtendimento({
  lead,
  hasNext,
  onNext,
  onClose,
  nomeUsuario,
}: {
  lead: LeadDTO;
  hasNext: boolean;
  onNext: () => void;
  onClose: () => void;
  nomeUsuario: string;
}) {
  const [etapa, setEtapa] = useState<Etapa>(() => estadoInicialPara(lead));
  const [pending, start] = useTransition();
  const [base, setBase] = useState<Partial<ResultadoAtendimento>>({});
  const [gk, setGk] = useState({ nome: "", cargo: "", telefone: "", horario: "" });
  const [motivo, setMotivo] = useState("");
  const [reuniao, setReuniao] = useState({ dataHora: "", tipo: "online" as "online" | "presencial" });
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [reagendando, setReagendando] = useState(false);
  const [meetLink, setMeetLink] = useState<string | null>(null);
  const [sucessoMsg, setSucessoMsg] = useState("Registrado. O sistema já agendou a próxima ação.");
  const [usuariosDisponiveis, setUsuariosDisponiveis] = useState<UsuarioBasico[]>([]);
  const [resumoParticipantes, setResumoParticipantes] = useState<ParticipanteView[]>([]);

  // Reinicia o fluxo ao trocar de lead (a fase atual decide a tela inicial).
  useEffect(() => {
    setEtapa(estadoInicialPara(lead));
    setBase({});
    setGk({ nome: "", cargo: "", telefone: "", horario: "" });
    setMotivo("");
    setReuniao({ dataHora: "", tipo: "online" });
    setParticipantes([]);
    setReagendando(false);
    setMeetLink(null);
    setSucessoMsg("Registrado. O sistema já agendou a próxima ação.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id]);

  useEffect(() => {
    listUsuariosAtivos()
      .then(setUsuariosDisponiveis)
      .catch(() => setUsuariosDisponiveis([]));
  }, []);

  useEffect(() => {
    if (etapa === "reuniao_resumo" && lead.reuniaoEventoId) {
      getEventoAttendees(lead.reuniaoEventoId)
        .then(setResumoParticipantes)
        .catch(() => setResumoParticipantes([]));
    }
  }, [etapa, lead.reuniaoEventoId]);

  function enviar(extra: Partial<ResultadoAtendimento>) {
    const payload: ResultadoAtendimento = {
      leadId: lead.id,
      canal: extra.canal ?? base.canal ?? "ligacao",
      ...base,
      ...extra,
    };
    start(async () => {
      const res = await registrarResultado(payload);
      setMeetLink(res?.meetLink ?? null);
      setEtapa("sucesso");
    });
  }

  function confirmarReuniao() {
    if (reagendando) {
      start(async () => {
        const res = await reagendarReuniao(lead.id, { ...reuniao, participantes });
        setMeetLink(res?.meetLink ?? null);
        setSucessoMsg("Reunião reagendada.");
        setEtapa("sucesso");
      });
    } else {
      setSucessoMsg("Reunião agendada. O sistema já criou o evento e moveu o lead.");
      enviar({
        canal: "ligacao",
        atendeu: true,
        decisor: true,
        interesse: true,
        reuniaoMarcada: true,
        reuniao: { ...reuniao, participantes },
      });
    }
  }

  function iniciarReagendamento() {
    setReuniao({
      dataHora: toDatetimeLocal(lead.proximoContatoMs),
      tipo: (lead.reuniaoTipo as "online" | "presencial") || "online",
    });
    setParticipantes([]);
    setReagendando(true);
    setEtapa("reuniao_form");
  }

  function confirmarCancelamento() {
    start(async () => {
      await cancelarReuniao(lead.id);
      setMeetLink(null);
      setSucessoMsg("Reunião cancelada. O lead volta pra etapa Qualificado.");
      setEtapa("sucesso");
    });
  }

  const wppLink = linkWhatsapp(
    lead.whatsapp || lead.telefone,
    nomeUsuario ? mensagemAbordagemInicial(nomeUsuario) : undefined,
  );
  function abrirWhatsapp() {
    if (wppLink) window.open(wppLink, "_blank", "noopener");
    setBase((b) => ({ ...b, canal: "whatsapp" }));
    setEtapa("whatsapp_resp");
  }

  const rec = lead.proximaAcaoRec;

  return (
    <div className="flex flex-col gap-4">
      {/* Banner da próxima ação recomendada */}
      {etapa === "inicio" && (
        <div
          className={`rounded-2xl border p-4 ${
            rec.atrasada ? "border-red-500/40 bg-red-500/5" : "border-roxo-light/30 bg-roxo/10"
          }`}
        >
          <p className="text-[11px] uppercase tracking-wide text-gelo-dim">Próxima ação recomendada</p>
          <p className="mt-1 font-display text-xl text-gelo">
            {rec.label}
            {rec.quandoLabel !== "—" && (
              <span className={`ml-2 text-sm ${rec.atrasada ? "text-red-300" : "text-gelo-dim"}`}>· {rec.quandoLabel}</span>
            )}
          </p>
        </div>
      )}

      {etapa === "inicio" && (
        <div className="flex flex-col gap-3">
          <button onClick={() => { setBase({ canal: "ligacao" }); setEtapa("atendeu"); }} className={btnPrimario}>
            <Phone className="h-5 w-5" /> Registrar ligação
          </button>
          <button onClick={abrirWhatsapp} className={btnNeutro} disabled={!wppLink} title={wppLink ? "" : "Sem número"}>
            <MessageCircle className="h-5 w-5" /> Enviar WhatsApp
          </button>
          <button onClick={() => setEtapa("encerrar")} className="mt-1 flex items-center justify-center gap-1 text-xs text-gelo-dim hover:text-red-300">
            <Ban className="h-3.5 w-3.5" /> Encerrar lead (número inválido / empresa fechou)
          </button>
        </div>
      )}

      {etapa === "atendeu" && (
        <div className="flex flex-col gap-4">
          <p className={pergunta}>A ligação foi atendida?</p>
          <SimNao onSim={() => setEtapa("decisor")} onNao={() => enviar({ canal: "ligacao", atendeu: false })} naoLabel="Não atendeu" />
        </div>
      )}

      {etapa === "decisor" && (
        <div className="flex flex-col gap-4">
          <p className={pergunta}>Falou com o decisor?</p>
          <SimNao
            onSim={() => { setBase((b) => ({ ...b, atendeu: true, decisor: true })); setEtapa("interesse"); }}
            onNao={() => { setBase((b) => ({ ...b, atendeu: true, decisor: false })); setEtapa("gatekeeper"); }}
          />
        </div>
      )}

      {etapa === "gatekeeper" && (
        <div className="flex flex-col gap-3">
          <p className={pergunta}>Dados de quem atendeu</p>
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Nome" value={gk.nome} onChange={(e) => setGk({ ...gk, nome: e.target.value })} className={inputCls} />
            <input placeholder="Cargo" value={gk.cargo} onChange={(e) => setGk({ ...gk, cargo: e.target.value })} className={inputCls} />
            <input placeholder="Telefone" value={gk.telefone} onChange={(e) => setGk({ ...gk, telefone: e.target.value })} className={inputCls} />
            <input placeholder="Melhor horário" value={gk.horario} onChange={(e) => setGk({ ...gk, horario: e.target.value })} className={inputCls} />
          </div>
          <button onClick={() => enviar({ canal: "ligacao", atendeu: true, decisor: false, gatekeeper: gk })} className={btnPrimario}>
            <ArrowRight className="h-5 w-5" /> Salvar e agendar nova tentativa
          </button>
        </div>
      )}

      {etapa === "interesse" && (
        <div className="flex flex-col gap-4">
          <p className={pergunta}>Conseguiu despertar interesse?</p>
          <SimNao onSim={() => setEtapa("reuniao")} onNao={() => setEtapa("motivo")} />
        </div>
      )}

      {etapa === "motivo" && (
        <div className="flex flex-col gap-3">
          <p className={pergunta}>Qual o motivo? (o lead continua no funil)</p>
          <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2} placeholder="Ex.: sem orçamento agora, já tem fornecedor..." className={inputCls} />
          <button onClick={() => enviar({ canal: "ligacao", atendeu: true, decisor: true, interesse: false, motivo, proximaAcao: "followup" })} className={btnPrimario}>
            <ArrowRight className="h-5 w-5" /> Registrar e agendar follow-up
          </button>
        </div>
      )}

      {etapa === "reuniao" && (
        <div className="flex flex-col gap-4">
          {lead.status === "qualificado" && (
            <p className="text-center text-xs text-gelo-dim">Lead qualificado — decisor já demonstrou interesse.</p>
          )}
          <p className={pergunta}>Conseguiu marcar reunião?</p>
          <SimNao onSim={() => { setReagendando(false); setEtapa("reuniao_form"); }} onNao={() => setEtapa("proxima")} />
        </div>
      )}

      {etapa === "reuniao_form" && (
        <div className="flex flex-col gap-3">
          <p className={pergunta}>{reagendando ? "Reagendar reunião" : "Detalhes da reunião"}</p>
          <input type="datetime-local" value={reuniao.dataHora} onChange={(e) => setReuniao({ ...reuniao, dataHora: e.target.value })} className={inputCls} />
          <div className="grid grid-cols-2 gap-2">
            {(["online", "presencial"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setReuniao({ ...reuniao, tipo: t })}
                className={`${btnGrande} border ${reuniao.tipo === t ? "border-roxo-light/60 bg-roxo/15 text-gelo" : "border-ink-line bg-ink text-gelo-dim"}`}
              >
                {t === "online" ? "Online" : "Presencial"}
              </button>
            ))}
          </div>
          <ParticipantesPicker usuarios={usuariosDisponiveis} selecionados={participantes} onChange={setParticipantes} />
          <button
            disabled={!reuniao.dataHora}
            onClick={confirmarReuniao}
            className={`${btnPrimario} disabled:opacity-40`}
          >
            <CalendarCheck className="h-5 w-5" /> {reagendando ? "Confirmar reagendamento" : "Agendar reunião e mover lead"}
          </button>
          {reagendando && (
            <button onClick={() => setEtapa("reuniao_resumo")} className="text-xs text-gelo-dim hover:text-gelo">Voltar</button>
          )}
        </div>
      )}

      {etapa === "reuniao_resumo" && (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-fuchsia-500/30 bg-fuchsia-500/5 p-4">
            <p className="text-[11px] uppercase tracking-wide text-gelo-dim">Reunião agendada</p>
            <p className="mt-1 font-display text-xl text-gelo">
              {lead.proximoContatoLabel}
              {lead.proximoContatoHoraLabel ? ` · ${lead.proximoContatoHoraLabel}` : ""}
            </p>
            {lead.reuniaoTipo && <p className="mt-1 text-sm capitalize text-gelo-dim">{lead.reuniaoTipo}</p>}
          </div>

          {resumoParticipantes.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className={labelCls}>Participantes</span>
              {resumoParticipantes.map((p) => (
                <div key={p.email} className="rounded-lg border border-ink-line bg-ink px-3 py-2 text-sm text-gelo">
                  {p.nome}
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2">
            {lead.reuniaoMeetLink && (
              <a
                href={lead.reuniaoMeetLink}
                target="_blank"
                rel="noopener noreferrer"
                className={`${btnGrande} border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20`}
              >
                <CalendarCheck className="h-5 w-5" /> Entrar na reunião (Meet)
              </a>
            )}
            <button onClick={iniciarReagendamento} className={btnNeutro}>
              <ArrowRight className="h-5 w-5" /> Reagendar
            </button>
            <button onClick={confirmarCancelamento} className="flex items-center justify-center gap-1 text-xs text-gelo-dim hover:text-red-300">
              <Ban className="h-3.5 w-3.5" /> Cancelar reunião
            </button>
          </div>
        </div>
      )}

      {etapa === "proxima" && (
        <div className="flex flex-col gap-3">
          <p className={pergunta}>Qual a próxima ação?</p>
          {([
            ["ligar", "Nova ligação"],
            ["whatsapp", "WhatsApp"],
            ["outro_horario", "Outro horário"],
            ["followup", "Agendar follow-up"],
          ] as const).map(([k, lbl]) => (
            <button
              key={k}
              onClick={() => enviar({ canal: "ligacao", atendeu: true, decisor: true, interesse: true, reuniaoMarcada: false, proximaAcao: k })}
              className={btnNeutro}
            >
              <ChevronRight className="h-4 w-4" /> {lbl}
            </button>
          ))}
        </div>
      )}

      {etapa === "whatsapp_resp" && (
        <div className="flex flex-col gap-4">
          <p className={pergunta}>O WhatsApp foi respondido?</p>
          <SimNao
            onSim={() => enviar({ canal: "whatsapp", atendeu: true })}
            onNao={() => enviar({ canal: "whatsapp", atendeu: false })}
            simLabel="Respondeu"
            naoLabel="Sem resposta"
          />
        </div>
      )}

      {etapa === "encerrar" && (
        <div className="flex flex-col gap-3">
          <p className={pergunta}>Encerrar definitivamente?</p>
          {MOTIVOS_ENCERRAMENTO.map((m) => (
            <button key={m.key} onClick={() => enviar({ encerrar: m.key })} className={`${btnGrande} border border-red-500/40 bg-red-500/10 text-red-200 hover:bg-red-500/20`}>
              <Ban className="h-5 w-5" /> {m.label}
            </button>
          ))}
          <button onClick={() => setEtapa(estadoInicialPara(lead))} className="text-xs text-gelo-dim hover:text-gelo">Voltar</button>
        </div>
      )}

      {etapa === "encerrado" && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-full ${
              lead.status === "convertido" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
            }`}
          >
            {lead.status === "convertido" ? <Check className="h-7 w-7" /> : <Ban className="h-7 w-7" />}
          </div>
          <p className="text-gelo">
            {lead.status === "convertido"
              ? "Lead convertido em cliente."
              : `Lead perdido${lead.motivoPerda ? `: ${lead.motivoPerda}` : "."}`}
          </p>
          <p className="text-xs text-gelo-dim">Use a aba Editar pra revisar o histórico completo.</p>
        </div>
      )}

      {etapa === "sucesso" && (
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
            <Check className="h-7 w-7" />
          </div>
          <p className="text-center text-gelo">{sucessoMsg}</p>
          <div className="flex w-full flex-col gap-2">
            {meetLink && (
              <a
                href={meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className={`${btnGrande} border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20`}
              >
                <CalendarCheck className="h-5 w-5" /> Entrar na reunião (Meet)
              </a>
            )}
            {hasNext && (
              <button onClick={onNext} className={btnPrimario}>
                <ArrowRight className="h-5 w-5" /> Próximo lead
              </button>
            )}
            <button onClick={onClose} className={btnNeutro}>Fechar</button>
          </div>
        </div>
      )}

      {pending && (
        <div className="flex items-center justify-center gap-2 text-sm text-gelo-dim">
          <Loader2 className="h-4 w-4 animate-spin" /> Registrando...
        </div>
      )}
    </div>
  );
}
