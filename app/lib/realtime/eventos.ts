import "server-only";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import { notificacoes } from "@/app/lib/db/schema";
import { publicarEvento } from "./pusher-server";
import { mensagemReuniaoMarcada, mensagemSilencioLongo } from "./mensagens";

// Ponto único de disparo de evento em tempo real (o "EventBus"/"Notification
// Dispatcher"): qualquer parte do sistema que quiser notificar a equipe passa
// por aqui, nunca chama o Pusher direto. Isso é o que deixa a arquitetura
// reutilizável — um evento novo (lead perdido, contrato assinado, meta
// batida...) só precisa de uma função nova aqui, o transporte/persistência
// já existem.
export type TipoEvento = "reuniao.marcada" | "silencio.longo";

async function emitir(tipo: TipoEvento, mensagem: string, payload: Record<string, unknown>): Promise<void> {
  const criadoEm = new Date();
  try {
    await getDb().insert(notificacoes).values({ tipo, mensagem, payload, criadoEm });
  } catch {
    // histórico é acessório — nunca bloqueia o disparo em tempo real
  }
  await publicarEvento(tipo, { tipo, mensagem, criadoEm: criadoEm.toISOString(), ...payload });
}

async function ultimaNotificacao(): Promise<{ tipo: string; criadoEm: Date } | null> {
  try {
    const rows = await getDb()
      .select({ tipo: notificacoes.tipo, criadoEm: notificacoes.criadoEm })
      .from(notificacoes)
      .orderBy(desc(notificacoes.criadoEm))
      .limit(1);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function ultimaNotificacaoDoTipo(tipo: TipoEvento): Promise<Date | null> {
  try {
    const rows = await getDb()
      .select({ criadoEm: notificacoes.criadoEm })
      .from(notificacoes)
      .where(eq(notificacoes.tipo, tipo))
      .orderBy(desc(notificacoes.criadoEm))
      .limit(1);
    return rows[0]?.criadoEm ?? null;
  } catch {
    return null;
  }
}

// Dispara quando um vendedor marca reunião nova (nunca em reagendamento).
// `contagemHoje` = quantas reuniões esse vendedor já marcou hoje (inclui esta).
export async function emitirReuniaoMarcada(nome: string, contagemHoje: number): Promise<void> {
  const ultima = await ultimaNotificacao();
  const apósSilencio = ultima?.tipo === "silencio.longo";
  const mensagem = mensagemReuniaoMarcada(nome, contagemHoje, apósSilencio);
  await emitir("reuniao.marcada", mensagem, { nome, contagemHoje });
}

// Dispara quando passa muito tempo sem reunião nova em horário comercial
// (checado pelo cron — ver app/admin/api/cron/checar-silencio).
export async function emitirSilencioLongo(): Promise<void> {
  const mensagem = mensagemSilencioLongo();
  await emitir("silencio.longo", mensagem, {});
}
