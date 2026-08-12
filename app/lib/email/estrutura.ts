// Estrutura reutilizável pros e-mails transacionais (Header/Content/
// CredentialsBox/CTA/Footer). Identidade atual da Boechat preservada —
// paleta neutra já usada em boas-vindas.ts. Design final fica com Jarbas e
// Cláudio; até lá, mantemos tokens simples e fáceis de trocar num só lugar.
//
// Nome "estrutura.ts", não "layout.ts": qualquer arquivo `layout.ts` dentro
// de app/** é convenção especial do App Router (exige default export de
// componente) — colidiria com esta pasta sendo lida como rota "/lib/email".

// E-mail HTML não roda por um framework que escapa por você (nem JSX, nem
// template engine): interpolar direto um campo vindo de formulário público
// (ex. nome de candidatura em /vagas/[token]) é XSS no cliente de e-mail de
// quem recebe. Todo valor dinâmico passa por aqui antes de entrar no HTML.
export function escapeHtml(valor: string): string {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const emailTokens = {
  texto: "#111",
  textoMuted: "#666",
  aviso: "#b00",
  fundoCredenciais: "#f6f6f6",
};

export function renderEmailLayout(opts: {
  saudacao: string;
  paragrafos: string[];
  credenciais?: { label: string; valor: string; mono?: boolean }[];
  ctaLabel?: string;
  ctaUrl?: string;
  avisoFinal?: string;
  rodape?: string;
}): string {
  const { saudacao, paragrafos, credenciais, ctaLabel, ctaUrl, avisoFinal, rodape } = opts;

  const linhasCredenciais = (credenciais ?? [])
    .map(
      (c) =>
        `<tr><td style="padding:4px 12px 4px 0;color:${emailTokens.textoMuted}">${escapeHtml(c.label)}</td><td>${
          c.mono ? `<code>${c.valor}</code>` : c.valor
        }</td></tr>`
    )
    .join("");

  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:${emailTokens.texto}">
      <h2>${escapeHtml(saudacao)}</h2>
      ${paragrafos.map((p) => `<p>${p}</p>`).join("\n")}
      ${
        linhasCredenciais
          ? `<table style="margin:16px 0;background:${emailTokens.fundoCredenciais};border-radius:8px;padding:4px 12px">${linhasCredenciais}</table>`
          : ""
      }
      ${
        ctaLabel && ctaUrl
          ? `<p><a href="${ctaUrl}" style="display:inline-block;background:#111;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">${escapeHtml(ctaLabel)}</a></p>`
          : ""
      }
      ${avisoFinal ? `<p style="color:${emailTokens.aviso}">${escapeHtml(avisoFinal)}</p>` : ""}
      ${rodape ? `<p>${escapeHtml(rodape)}</p>` : `<p>Qualquer dúvida, chama a gente.</p>`}
    </div>
  `;
}
