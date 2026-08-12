import "server-only";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import { usuarios, userCargos, cargos, auditLogs } from "@/app/lib/db/schema";
import { hashSenha } from "@/app/lib/auth-db";
import { gerarSenhaTemporariaPura, gerarLoginUnicoPuro } from "@/app/lib/usuarios/gerar";
import { enviarEmail } from "@/app/lib/email/resend";
import { templateBoasVindas } from "@/app/lib/email/boas-vindas";
import { registrarAudit } from "@/app/lib/audit";

// Camada única de provisionamento de acesso, reutilizada por
// contratarCandidatura (recrutamento-actions.ts), pela criação manual com
// envio de acesso (usuarios-actions.ts) e pelo reenvio. Lógica PURA, fora de
// "use server": quem expõe isto como Server Action aplica a guarda de
// permissão própria antes de chamar (mesmo padrão de usuarios/gerar.ts, ver
// A7/C1). Nenhuma função aqui grava senha em texto puro nem loga/audita
// senha — só o hash vai pro banco.

// Ações de audit deste módulo. Reaproveita a tabela audit_logs existente
// (ator/afetado/acao/resultado/detalhe/criadoEm) em vez de criar tabela ou
// colunas novas só pra status de envio — ela já tem tudo que precisamos.
export const ACESSO_EMAIL_ENVIADO = "acesso.email_enviado";
export const ACESSO_EMAIL_FALHOU = "acesso.email_falhou";
export const ACESSO_REENVIADO = "acesso.reenviado";

function urlPlataformaPadrao(): string {
  return process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/contratos/login`
    : "https://boechatcompany.com/contratos/login";
}

export type PreviewAcesso = {
  nome: string;
  emailPessoal: string;
  login: string;
  senhaTemporaria: string;
  cargoId: number | null;
  cargoNome: string | null;
  assunto: string;
  html: string;
  urlPlataforma: string;
};

// Prepara os dados de um novo acesso SEM gravar nada no banco: a checagem
// de unicidade do login é uma leitura idempotente (mesma que gerarLoginUnico
// já expõe hoje), a senha é gerada em memória. Nada é persistido até
// confirmarCriarAcesso ser chamada — é assim que a prévia funciona sem
// criar usuário "só pra mostrar" (Melhoria 1).
export async function prepararPreviewAcesso(opts: {
  nome: string;
  emailPessoal: string;
  cargoId: number | null;
  assuntoCustom?: string;
  saudacaoCustom?: string;
  textoComplementarCustom?: string;
}): Promise<PreviewAcesso> {
  const { nome, emailPessoal, cargoId, assuntoCustom, saudacaoCustom, textoComplementarCustom } = opts;
  const login = await gerarLoginUnicoPuro(nome);
  const senhaTemporaria = gerarSenhaTemporariaPura();
  const urlPlataforma = urlPlataformaPadrao();

  let cargoNome: string | null = null;
  if (cargoId) {
    const c = (await getDb().select({ nome: cargos.nome }).from(cargos).where(eq(cargos.id, cargoId)).limit(1))[0];
    cargoNome = c?.nome ?? null;
  }

  const { subject, html } = templateBoasVindas({
    nome,
    username: login,
    senhaTemporaria,
    urlPlataforma,
    cargo: cargoNome ?? undefined,
    assunto: assuntoCustom,
    saudacaoCustom,
    textoComplementar: textoComplementarCustom,
  });

  return { nome, emailPessoal, login, senhaTemporaria, cargoId, cargoNome, assunto: subject, html, urlPlataforma };
}

export type ConfirmarAcessoResult =
  | { ok: false; erro: string }
  | { ok: true; usuarioId: number; username: string; emailEnviado: boolean; emailMotivo?: string };

// Efetiva o acesso preparado pela prévia: valida de novo (login/e-mail podem
// ter deixado de estar livres entre a prévia e a confirmação), cria o
// usuário, atribui cargo, envia o e-mail e audita. Ponto único usado tanto
// pela contratação de candidatura quanto pela criação manual com acesso.
export async function confirmarCriarAcesso(opts: {
  ator: string;
  nome: string;
  emailPessoal: string;
  telefone?: string;
  cargoId: number | null;
  login: string;
  senhaTemporaria: string;
  assunto?: string;
  saudacaoCustom?: string;
  textoComplementar?: string;
  acaoAudit: string;
}): Promise<ConfirmarAcessoResult> {
  const { ator, nome, emailPessoal, telefone, cargoId, login, senhaTemporaria, assunto, saudacaoCustom, textoComplementar, acaoAudit } = opts;
  const db = getDb();

  if (!emailPessoal.trim()) return { ok: false, erro: "Informe o e-mail pessoal para enviar o acesso." };

  const jaEmail = (await db.select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.email, emailPessoal)).limit(1))[0];
  if (jaEmail) return { ok: false, erro: "Já existe um usuário com este e-mail." };
  const jaLogin = (await db.select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.username, login)).limit(1))[0];
  if (jaLogin) return { ok: false, erro: "Este login deixou de estar disponível. Gere a prévia novamente." };

  const inserido = await db
    .insert(usuarios)
    .values({
      username: login,
      nomeCompleto: nome,
      email: emailPessoal,
      telefone: telefone ?? "",
      senhaHash: hashSenha(senhaTemporaria),
      trocaSenhaObrigatoria: true,
    })
    .returning({ id: usuarios.id });
  const usuarioId = inserido[0].id;

  let cargoNome: string | null = null;
  if (cargoId) {
    await db.insert(userCargos).values({ usuarioId, cargoId }).onConflictDoNothing();
    const c = (await db.select({ nome: cargos.nome }).from(cargos).where(eq(cargos.id, cargoId)).limit(1))[0];
    cargoNome = c?.nome ?? null;
  }

  const urlPlataforma = urlPlataformaPadrao();
  const { subject, html } = templateBoasVindas({
    nome,
    username: login,
    senhaTemporaria,
    urlPlataforma,
    cargo: cargoNome ?? undefined,
    assunto,
    saudacaoCustom,
    textoComplementar,
  });
  const envio = await enviarEmail({ to: emailPessoal, subject, html });

  await registrarAudit({ ator, afetado: login, acao: acaoAudit });
  await registrarAudit({
    ator,
    afetado: login,
    acao: envio.ok ? ACESSO_EMAIL_ENVIADO : ACESSO_EMAIL_FALHOU,
    resultado: envio.ok ? "ok" : "erro",
    detalhe: envio.ok ? `destinatário: ${emailPessoal}` : (envio.motivo ?? ""),
  });

  return { ok: true, usuarioId, username: login, emailEnviado: envio.ok, emailMotivo: envio.motivo };
}

export type ReenviarAcessoResult =
  | { ok: false; erro: string }
  | { ok: true; emailEnviado: boolean; emailMotivo?: string };

// Reenvio: NUNCA cria usuário novo, atua sobre o mesmo registro. Gera senha
// provisória nova (a antiga deixa de valer: sessaoVersao incrementa,
// invalidando qualquer sessão viva com o token antigo — mesmo mecanismo de
// redefinirSenhaUsuario em usuarios-actions.ts, C4 da auditoria de
// segurança).
export async function reenviarAcesso(usuarioId: number, ator: string): Promise<ReenviarAcessoResult> {
  const db = getDb();
  const alvo = (await db.select().from(usuarios).where(eq(usuarios.id, usuarioId)).limit(1))[0];
  if (!alvo || alvo.deletedAt) return { ok: false, erro: "Usuário não encontrado." };
  if (!alvo.email.trim()) return { ok: false, erro: "Usuário sem e-mail cadastrado, não é possível reenviar." };

  const senhaTemporaria = gerarSenhaTemporariaPura();
  await db
    .update(usuarios)
    .set({ senhaHash: hashSenha(senhaTemporaria), trocaSenhaObrigatoria: true, sessaoVersao: sql`${usuarios.sessaoVersao} + 1` })
    .where(eq(usuarios.id, usuarioId));

  const urlPlataforma = urlPlataformaPadrao();
  const { subject, html } = templateBoasVindas({
    nome: alvo.nomeCompleto || alvo.username,
    username: alvo.username,
    senhaTemporaria,
    urlPlataforma,
  });
  const envio = await enviarEmail({ to: alvo.email, subject, html });

  await registrarAudit({ ator, afetado: alvo.username, acao: ACESSO_REENVIADO });
  await registrarAudit({
    ator,
    afetado: alvo.username,
    acao: envio.ok ? ACESSO_EMAIL_ENVIADO : ACESSO_EMAIL_FALHOU,
    resultado: envio.ok ? "ok" : "erro",
    detalhe: envio.ok ? `destinatário: ${alvo.email}` : (envio.motivo ?? ""),
  });

  return { ok: true, emailEnviado: envio.ok, emailMotivo: envio.motivo };
}

export type StatusUltimoEnvio = { status: "sent" | "failed"; quando: string; detalhe: string };

// Lê o último evento de envio de acesso pro username, direto do audit log
// existente — sem tabela/coluna nova (Melhoria 5).
export async function statusUltimoEnvioAcesso(username: string): Promise<StatusUltimoEnvio | null> {
  const maisRecente = (
    await getDb()
      .select({ acao: auditLogs.acao, detalhe: auditLogs.detalhe, criadoEm: auditLogs.criadoEm })
      .from(auditLogs)
      .where(and(eq(auditLogs.afetado, username), inArray(auditLogs.acao, [ACESSO_EMAIL_ENVIADO, ACESSO_EMAIL_FALHOU])))
      .orderBy(desc(auditLogs.criadoEm))
      .limit(1)
  )[0];
  if (!maisRecente) return null;
  return {
    status: maisRecente.acao === ACESSO_EMAIL_ENVIADO ? "sent" : "failed",
    quando: new Date(maisRecente.criadoEm).toLocaleString("pt-BR"),
    detalhe: maisRecente.detalhe,
  };
}
