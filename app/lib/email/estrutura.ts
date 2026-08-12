import "server-only";

// Estrutura reutilizável pros e-mails transacionais (Header com logo/CTA/
// CredentialsBox/Footer). Identidade puxada do design system real do site
// (app/globals.css — tokens --color-roxo/--color-ink/--color-gelo — e
// public/logo/boechat-wordmark-dark.png), não inventada. O wordmark do
// produto em si é texto com fonte customizada (Archivo Black); e-mail não
// pode depender de fonte customizada carregando em todo cliente, por isso
// aqui é a arte em PNG, uso padrão de e-mail transacional.
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

// Mesmos valores de app/globals.css (:root). Fundo claro de propósito: dark
// mode em e-mail depende do cliente respeitar meta color-scheme, o que
// Outlook e boa parte do Gmail não fazem direito — texto escuro sumindo em
// fundo escuro é o bug clássico. Roxo como acento resolve a identidade sem
// depender disso.
export const emailTokens = {
  roxo: "#6d28d9",
  roxoLight: "#a78bfa",
  roxoTint: "#f3effe", // roxo bem clareado, fundo da caixa de credenciais
  ink: "#171221", // = --color-ink, texto principal
  inkMuted: "#5b5468",
  aviso: "#b45309",
  avisoFundo: "#fffbeb",
  bordaFundo: "#f0edf7", // moldura externa do e-mail
  branco: "#ffffff",
};

function urlBase(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://boechatcompany.com";
}

export function logoUrl(): string {
  return `${urlBase()}/logo/boechat-wordmark-dark.png`;
}

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
  const t = emailTokens;

  const linhasCredenciais = (credenciais ?? [])
    .map(
      (c) => `
        <tr>
          <td style="padding:7px 0;border-bottom:1px solid ${t.roxoTint};font:13px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;color:${t.inkMuted}">${escapeHtml(c.label)}</td>
          <td style="padding:7px 0;border-bottom:1px solid ${t.roxoTint};text-align:right;font:${c.mono ? "600 15px/1.4 ui-monospace,Menlo,monospace" : "600 14px/1.4 -apple-system,Segoe UI,Roboto,sans-serif"};color:${t.ink}">${c.valor}</td>
        </tr>`
    )
    .join("");

  // Tabela como container principal (não flex/grid): é o que sobrevive nos
  // motores de renderização de e-mail mais restritos (Outlook desktop usa o
  // Word como engine). Estilo sempre inline, sem <style> externo/classe.
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${t.bordaFundo};padding:32px 16px;font-family:-apple-system,Segoe UI,Roboto,sans-serif">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:${t.branco};border-radius:16px;overflow:hidden">
            <tr>
              <td style="padding:28px 32px;background:${t.roxo}">
                <img src="${logoUrl()}" alt="Boechat" height="24" style="display:block;height:24px;width:auto;border:0" />
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 8px">
                <p style="margin:0 0 16px;font:700 20px/1.3 -apple-system,Segoe UI,Roboto,sans-serif;color:${t.ink}">${escapeHtml(saudacao)}</p>
                ${paragrafos.map((p) => `<p style="margin:0 0 14px;font:14px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:${t.inkMuted}">${p}</p>`).join("\n")}
              </td>
            </tr>
            ${
              linhasCredenciais
                ? `<tr><td style="padding:4px 32px 8px">
                     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${t.roxoTint};border-radius:12px;padding:4px 16px">
                       ${linhasCredenciais}
                     </table>
                   </td></tr>`
                : ""
            }
            ${
              ctaLabel && ctaUrl
                ? `<tr><td style="padding:20px 32px 4px" align="center">
                     <a href="${ctaUrl}" style="display:inline-block;background:${t.roxo};color:${t.branco};font:600 14px/1 -apple-system,Segoe UI,Roboto,sans-serif;padding:13px 28px;border-radius:999px;text-decoration:none">${escapeHtml(ctaLabel)}</a>
                   </td></tr>`
                : ""
            }
            ${
              avisoFinal
                ? `<tr><td style="padding:20px 32px 0">
                     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${t.avisoFundo};border-radius:10px">
                       <tr><td style="padding:10px 14px;font:13px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:${t.aviso}">${escapeHtml(avisoFinal)}</td></tr>
                     </table>
                   </td></tr>`
                : ""
            }
            <tr>
              <td style="padding:24px 32px 28px">
                <p style="margin:0;font:12px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:${t.inkMuted}">${rodape ? escapeHtml(rodape) : "Qualquer dúvida, chama a gente."}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}
