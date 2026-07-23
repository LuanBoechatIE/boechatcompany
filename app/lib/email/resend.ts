import "server-only";
import { Resend } from "resend";

// Envio de e-mail transacional (Resend). Greenfield: nenhum outro módulo
// manda e-mail hoje. Segue o mesmo padrão fail-soft do Google OAuth
// (app/lib/google/oauth.ts) — sem env configurada, não quebra o fluxo que
// chamou, só devolve { ok: false } pra quem chamou decidir o que mostrar.
export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
}

export type EnvioEmailResult = { ok: boolean; motivo?: string };

export async function enviarEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<EnvioEmailResult> {
  if (!emailConfigured()) {
    return { ok: false, motivo: "E-mail não configurado (RESEND_API_KEY/RESEND_FROM ausentes)." };
  }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM!,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    if (error) return { ok: false, motivo: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, motivo: e instanceof Error ? e.message : "Erro ao enviar e-mail." };
  }
}
