import "server-only";
import { getDb } from "@/app/lib/db";
import { notificacoes } from "@/app/lib/db/schema";
import { publicarEvento } from "./pusher-server";
import { mensagemReuniaoMarcada } from "./mensagens";

// Ponto único de disparo de evento em tempo real (o "EventBus"/"Notification
// Dispatcher"): qualquer parte do sistema que quiser notificar a equipe passa
// por aqui, nunca chama o Pusher direto. Isso é o que deixa a arquitetura
// reutilizável — um evento novo (lead perdido, contrato assinado, meta
// batida...) só precisa de uma função nova aqui, o transporte/persistência
// já existem.
export type TipoEvento = "reuniao.marcada" | "chamada.rapida";

async function emitir(tipo: TipoEvento, mensagem: string, payload: Record<string, unknown>): Promise<void> {
  const criadoEm = new Date();
  try {
    await getDb().insert(notificacoes).values({ tipo, mensagem, payload, criadoEm });
  } catch {
    // histórico é acessório — nunca bloqueia o disparo em tempo real
  }
  await publicarEvento(tipo, { tipo, mensagem, criadoEm: criadoEm.toISOString(), ...payload });
}

// Dispara quando um vendedor marca reunião nova (nunca em reagendamento).
// `contagemHoje` = quantas reuniões esse vendedor já marcou hoje (inclui esta).
export async function emitirReuniaoMarcada(nome: string, contagemHoje: number): Promise<void> {
  const mensagem = mensagemReuniaoMarcada(nome, contagemHoje);
  await emitir("reuniao.marcada", mensagem, { nome, contagemHoje });
}

// Dispara quando um admin usa o botão flutuante de chamada rápida (abre Meet
// e chama o resto da equipe). `meetLink` pode vir vazio se o Google Calendar
// não estiver conectado — a notificação sai mesmo assim, só sem o link.
export async function emitirChamadaRapida(nomeQuemChama: string, meetLink: string): Promise<void> {
  const mensagem = `📞 ${nomeQuemChama} tá te chamando pra uma reunião agora!`;
  await emitir("chamada.rapida", mensagem, { nome: nomeQuemChama, meetLink });
}
