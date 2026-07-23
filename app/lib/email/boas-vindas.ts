// Template do e-mail de boas-vindas enviado no momento da contratação
// (app/admin/recrutamento-actions.ts -> contratarCandidatura). A senha
// temporária só existe em memória até este e-mail sair; nunca é persistida
// em texto puro (o banco guarda só o hash).
export function templateBoasVindas(opts: {
  nome: string;
  username: string;
  senhaTemporaria: string;
  urlPlataforma: string;
}): { subject: string; html: string } {
  const { nome, username, senhaTemporaria, urlPlataforma } = opts;
  return {
    subject: "Seu acesso à plataforma Boechat",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#111">
        <h2>Bem-vindo(a), ${nome}!</h2>
        <p>Sua conta na plataforma da Boechat foi criada. Use os dados abaixo pra acessar:</p>
        <table style="margin:16px 0">
          <tr><td style="padding:4px 12px 4px 0;color:#666">Link</td><td><a href="${urlPlataforma}">${urlPlataforma}</a></td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666">Login</td><td>${username}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666">Senha temporária</td><td><code>${senhaTemporaria}</code></td></tr>
        </table>
        <p style="color:#b00">Esta senha só funciona uma vez: no primeiro acesso, você vai ser obrigado(a) a trocá-la.</p>
        <p>Qualquer dúvida, chama a gente.</p>
      </div>
    `,
  };
}
