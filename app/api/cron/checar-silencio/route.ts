import { NextRequest, NextResponse } from "next/server";
import { dbConfigured } from "@/app/lib/db";
import { ultimaNotificacaoDoTipo, emitirSilencioLongo } from "@/app/lib/realtime/eventos";

export const dynamic = "force-dynamic";

const LIMIAR_MS = 2 * 60 * 60 * 1000; // 2h

// Horário comercial (fuso de Brasília, seg-sex, 8h-19h). Vercel Cron roda em
// UTC; convertemos aqui em vez de depender do fuso do servidor.
function emHorarioComercial(agora: Date): boolean {
  const horaBrasilia = new Date(agora.getTime() - 3 * 60 * 60 * 1000);
  const dia = horaBrasilia.getUTCDay(); // 0=dom...6=sab (UTC aqui já é a hora local de Brasília)
  const hora = horaBrasilia.getUTCHours();
  if (dia === 0 || dia === 6) return false;
  return hora >= 8 && hora < 19;
}

// Chamado pelo Vercel Cron (ver vercel.json) a cada 15min. Protegido pelo
// header que a Vercel injeta em cron requests quando CRON_SECRET está
// configurado; sem a env, aceita qualquer chamada (fail-open, igual ao resto
// do sistema de notificações — nunca quebra por falta de configuração).
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, erro: "não autorizado" }, { status: 401 });
    }
  }

  if (!dbConfigured()) return NextResponse.json({ ok: true, motivo: "banco não configurado" });

  const agora = new Date();
  if (!emHorarioComercial(agora)) {
    return NextResponse.json({ ok: true, motivo: "fora do horário comercial" });
  }

  const [ultimaReuniao, ultimoAviso] = await Promise.all([
    ultimaNotificacaoDoTipo("reuniao.marcada"),
    ultimaNotificacaoDoTipo("silencio.longo"),
  ]);

  // Sem nenhuma reunião registrada ainda, não tem "silêncio" pra medir.
  if (!ultimaReuniao) return NextResponse.json({ ok: true, motivo: "sem histórico de reunião" });

  const gapMs = agora.getTime() - ultimaReuniao.getTime();
  if (gapMs < LIMIAR_MS) return NextResponse.json({ ok: true, motivo: "dentro do limiar" });

  // Já avisou desse silêncio (aviso é mais novo que a última reunião)? Não repete.
  if (ultimoAviso && ultimoAviso.getTime() > ultimaReuniao.getTime()) {
    return NextResponse.json({ ok: true, motivo: "já avisado" });
  }

  await emitirSilencioLongo();
  return NextResponse.json({ ok: true, disparado: true });
}
