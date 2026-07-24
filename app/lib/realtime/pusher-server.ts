import "server-only";
import Pusher from "pusher";

// Transporte real-time (Pusher Channels). Escolhido porque o deploy é
// serverless (Vercel + Neon HTTP) — não há processo persistente pra manter
// um WebSocket próprio nem estado compartilhado entre invocações. O Pusher
// resolve isso: o servidor só dispara um evento via REST, a entrega em
// tempo real pros navegadores é toda gerenciada por eles.
//
// Só existe UM canal (a Boechat é uma empresa só, não multi-tenant) — todo
// usuário autenticado do /admin recebe tudo. Se um dia isso virar multi-
// empresa, o canal troca pra `empresa-${id}` sem mudar o resto da arquitetura.
export const CANAL_EQUIPE = "boechat-equipe";

export function realtimeConfigured(): boolean {
  return Boolean(
    process.env.PUSHER_APP_ID &&
      process.env.PUSHER_KEY &&
      process.env.PUSHER_SECRET &&
      process.env.PUSHER_CLUSTER,
  );
}

let _pusher: Pusher | null = null;

function getPusher(): Pusher {
  if (_pusher) return _pusher;
  _pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.PUSHER_CLUSTER!,
    useTLS: true,
  });
  return _pusher;
}

// Fail-soft: sem env configurada, não dispara (nem quebra quem chamou).
export async function publicarEvento(evento: string, payload: unknown): Promise<void> {
  if (!realtimeConfigured()) return;
  try {
    await getPusher().trigger(CANAL_EQUIPE, evento, payload);
  } catch {
    // notificação é sempre um "extra" — nunca pode derrubar a ação principal
    // que a originou (marcar reunião, etc.)
  }
}
