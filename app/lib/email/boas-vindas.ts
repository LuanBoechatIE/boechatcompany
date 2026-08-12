import { escapeHtml, renderEmailLayout } from "@/app/lib/email/estrutura";

// Template do e-mail de acesso, enviado na contratação (recrutamento-
// actions.ts -> contratarCandidatura), na criação manual de usuário com
// envio de acesso e no reenvio (usuarios/provisionamento.ts). A senha
// temporária só existe em memória até este e-mail sair; nunca é persistida
// em texto puro (o banco guarda só o hash).
//
// assunto/saudacaoCustom/textoComplementar são opcionais: sem eles, mantém
// o texto padrão de sempre (compatível com a chamada existente em
// contratarCandidatura). A prévia de acesso permite editá-los antes do
// envio. nome/username podem vir de fonte pública (candidatura enviada por
// formulário em /vagas/[token]) — por isso passam por escapeHtml, tanto
// aqui quanto dentro de renderEmailLayout.
export function templateBoasVindas(opts: {
  nome: string;
  username: string;
  senhaTemporaria: string;
  urlPlataforma: string;
  cargo?: string;
  assunto?: string;
  saudacaoCustom?: string;
  textoComplementar?: string;
}): { subject: string; html: string } {
  const { nome, username, senhaTemporaria, urlPlataforma, cargo, assunto, saudacaoCustom, textoComplementar } = opts;
  const html = renderEmailLayout({
    saudacao: saudacaoCustom?.trim() || `Bem-vindo(a), ${nome}!`,
    paragrafos: [
      "Sua conta na plataforma da Boechat foi criada. Use os dados abaixo pra acessar:",
      ...(textoComplementar?.trim() ? [escapeHtml(textoComplementar)] : []),
    ],
    credenciais: [
      { label: "Login", valor: escapeHtml(username) },
      { label: "Senha temporária", valor: escapeHtml(senhaTemporaria), mono: true },
      ...(cargo?.trim() ? [{ label: "Cargo", valor: escapeHtml(cargo) }] : []),
    ],
    ctaLabel: "Acessar plataforma",
    ctaUrl: urlPlataforma,
    avisoFinal: "Esta senha só funciona uma vez: no primeiro acesso, você vai ser obrigado(a) a trocá-la.",
  });
  return {
    subject: assunto?.trim() || "Seu acesso à plataforma Boechat",
    html,
  };
}
