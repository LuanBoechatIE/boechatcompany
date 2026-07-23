// Motor de cadência do Sales OS. Funções puras que decidem a PRÓXIMA AÇÃO e o
// agendamento automático dos follow-ups. Usado tanto na camada de dados
// (recomendação exibida) quanto nas server actions (agendamento real).
//
// Cadência padrão (editável no futuro): 2 ligações + 2 no mesmo dia + 2 no dia
// seguinte -> WhatsApp -> ligar após o WhatsApp -> nutrição.

import type { AcaoTipo } from "./types";

export type PassoCadencia = {
  canal: "ligacao" | "whatsapp";
  tipo: AcaoTipo;
  label: string;
  // Calcula o horário sugerido a partir do momento do registro.
  agenda: (base: Date) => Date;
};

function addMinutes(d: Date, m: number): Date {
  return new Date(d.getTime() + m * 60_000);
}
function addHours(d: Date, h: number): Date {
  return new Date(d.getTime() + h * 3_600_000);
}
function proximoDiaAs(base: Date, hora: number, min = 0): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + 1);
  d.setHours(hora, min, 0, 0);
  return d;
}

// Passos da cadência. O índice é o `cadenciaPasso` guardado no lead.
export const CADENCIA: PassoCadencia[] = [
  { canal: "ligacao", tipo: "ligar", label: "Ligar agora", agenda: (b) => b },
  { canal: "ligacao", tipo: "ligar", label: "Ligar de novo (em ~45min)", agenda: (b) => addMinutes(b, 45) },
  { canal: "ligacao", tipo: "ligar", label: "Ligar à tarde", agenda: (b) => addHours(b, 3) },
  { canal: "ligacao", tipo: "ligar", label: "Ligar no fim do dia", agenda: (b) => addHours(b, 5) },
  { canal: "ligacao", tipo: "ligar", label: "Ligar amanhã de manhã", agenda: (b) => proximoDiaAs(b, 9) },
  { canal: "ligacao", tipo: "ligar", label: "Ligar amanhã à tarde", agenda: (b) => proximoDiaAs(b, 15) },
  { canal: "whatsapp", tipo: "whatsapp", label: "Enviar WhatsApp", agenda: (b) => proximoDiaAs(b, 9) },
  { canal: "ligacao", tipo: "ligar", label: "Ligar após o WhatsApp", agenda: (b) => proximoDiaAs(b, 10) },
];

// Depois de esgotar a cadência, entra em nutrição (aguardar N dias).
const NUTRICAO_DIAS = 7;

export const CADENCIA_MAX = CADENCIA.length;

// Dado o passo atual, retorna o próximo passo e seu horário agendado.
export function proximoPasso(
  passoAtual: number,
  base: Date = new Date(),
): { passo: number; canal: "ligacao" | "whatsapp" | "nenhum"; tipo: AcaoTipo; label: string; quando: Date } {
  const prox = passoAtual + 1;
  if (prox < CADENCIA.length) {
    const p = CADENCIA[prox];
    return { passo: prox, canal: p.canal, tipo: p.tipo, label: p.label, quando: p.agenda(base) };
  }
  // Cadência esgotada -> nutrição.
  const quando = new Date(base);
  quando.setDate(quando.getDate() + NUTRICAO_DIAS);
  quando.setHours(9, 0, 0, 0);
  return { passo: prox, canal: "nenhum", tipo: "aguardar", label: `Retomar em ${NUTRICAO_DIAS} dias`, quando };
}

// Passo/horário para uma escolha manual de próxima ação (quando não marcou reunião).
export function agendarEscolha(
  escolha: "ligar" | "whatsapp" | "outro_horario" | "followup",
  base: Date = new Date(),
): { tipo: AcaoTipo; quando: Date; label: string } {
  switch (escolha) {
    case "ligar":
      return { tipo: "ligar", quando: proximoDiaAs(base, 9), label: "Ligar amanhã" };
    case "whatsapp":
      return { tipo: "whatsapp", quando: addHours(base, 1), label: "Enviar WhatsApp" };
    case "outro_horario":
      return { tipo: "ligar", quando: proximoDiaAs(base, 14), label: "Ligar em outro horário" };
    case "followup":
    default:
      return { tipo: "ligar", quando: proximoDiaAs(base, 9), label: "Follow-up" };
  }
}

// Label humano do horário relativo a agora ("agora", "hoje 16:00", "amanhã 09:00").
export function quandoLabel(quando: Date | null, now: Date = new Date()): string {
  if (!quando) return "sem agendamento";
  const diffMin = (quando.getTime() - now.getTime()) / 60_000;
  if (diffMin <= 5) return "agora";
  const hhmm = quando.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const hoje = new Date(now); hoje.setHours(0, 0, 0, 0);
  const dia = new Date(quando); dia.setHours(0, 0, 0, 0);
  const dDias = Math.round((dia.getTime() - hoje.getTime()) / 86_400_000);
  if (dDias <= 0) return `hoje ${hhmm}`;
  if (dDias === 1) return `amanhã ${hhmm}`;
  return `${quando.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} ${hhmm}`;
}
