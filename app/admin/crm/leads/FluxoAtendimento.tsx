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
} from "lucide-react";
import {
  MOTIVOS_ENCERRAMENTO,
  type LeadDTO,
  type ResultadoAtendimento,
} from "@/app/lib/crm/types";
import { registrarResultado } from "../../crm-actions";

type Etapa =
  | "inicio"
  | "atendeu"
  | "decisor"
  | "gatekeeper"
  | "interesse"
  | "motivo"
  | "reuniao"
  | "reuniao_form"
  | "proxima"
  | "whatsapp_resp"
  | "encerrar"
  | "sucesso";

const soDigitos = (s: string) => (s || "").replace(/\D/g, "");

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

const pergunta = "text-center text-lg font-medium text-gelo";
const inputCls = "w-full rounded-xl border border-ink-line bg-ink p-2.5 text-sm outline-none focus:border-roxo-light/60";

export function FluxoAtendimento({
  lead,
  hasNext,
  onNext,
  onClose,
}: {
  lead: LeadDTO;
  hasNext: boolean;
  onNext: () => void;
  onClose: () => void;
}) {
  const [etapa, setEtapa] = useState<Etapa>("inicio");
  const [pending, start] = useTransition();
  const [base, setBase] = useState<Partial<ResultadoAtendimento>>({});
  const [gk, setGk] = useState({ nome: "", cargo: "", telefone: "", horario: "" });
  const [motivo, setMotivo] = useState("");
  const [reuniao, setReuniao] = useState({ dataHora: "", tipo: "online" as "online" | "presencial" });
  const [meetLink, setMeetLink] = useState<string | null>(null);

  // Reinicia o fluxo ao trocar de lead.
  useEffect(() => {
    setEtapa("inicio");
    setBase({});
    setGk({ nome: "", cargo: "", telefone: "", horario: "" });
    setMotivo("");
    setReuniao({ dataHora: "", tipo: "online" });
    setMeetLink(null);
  }, [lead.id]);

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

  const wppNum = soDigitos(lead.whatsapp || lead.telefone);
  function abrirWhatsapp() {
    if (wppNum) window.open(`https://wa.me/55${wppNum}`, "_blank", "noopener");
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
          <button onClick={abrirWhatsapp} className={btnNeutro} disabled={!wppNum} title={wppNum ? "" : "Sem número"}>
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
          <p className={pergunta}>Conseguiu marcar reunião?</p>
          <SimNao onSim={() => setEtapa("reuniao_form")} onNao={() => setEtapa("proxima")} />
        </div>
      )}

      {etapa === "reuniao_form" && (
        <div className="flex flex-col gap-3">
          <p className={pergunta}>Detalhes da reunião</p>
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
          <button
            disabled={!reuniao.dataHora}
            onClick={() => enviar({ canal: "ligacao", atendeu: true, decisor: true, interesse: true, reuniaoMarcada: true, reuniao })}
            className={`${btnPrimario} disabled:opacity-40`}
          >
            <CalendarCheck className="h-5 w-5" /> Agendar reunião e mover lead
          </button>
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
          <button onClick={() => setEtapa("inicio")} className="text-xs text-gelo-dim hover:text-gelo">Voltar</button>
        </div>
      )}

      {etapa === "sucesso" && (
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
            <Check className="h-7 w-7" />
          </div>
          <p className="text-center text-gelo">Registrado. O sistema já agendou a próxima ação.</p>
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
