import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, createSession } from "../../../lib/auth";
import { verificarSenha } from "../../../lib/auth-db";
import { registrarAudit, origemDoPedido } from "../../../lib/audit";
import {
  chaveDe,
  consultar,
  faxinaOportunista,
  limpar,
  registrarTentativa,
  LOGIN_POR_CONTA,
  LOGIN_POR_IP,
} from "../../../lib/rate-limit";

/**
 * Login da área interna.
 *
 * Ordem importa: o limite é CONSULTADO antes de conferir a senha. Assim uma
 * conta já bloqueada não chega a gastar scrypt, que é exatamente o custo que o
 * atacante quer impor ao servidor.
 *
 * O contador só sobe em FALHA. Login certo não gasta cota, senão quem trabalha
 * o dia inteiro se tranca sozinho.
 *
 * O 429 é decidido pelo hash do login tentado, exista a conta ou não, então a
 * resposta não serve pra descobrir quem tem cadastro.
 */

const MINUTO = 60;

function minutosLegiveis(segundos: number): number {
  return Math.max(1, Math.ceil(segundos / MINUTO));
}

export async function POST(req: NextRequest) {
  let username = "";
  let password = "";
  try {
    const body = await req.json();
    username = String(body.username ?? "");
    password = String(body.password ?? "");
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const origem = origemDoPedido(req.headers);
  // Cortado: o campo é livre, e não há motivo pra gravar quilobyte por tentativa.
  const ator = username.slice(0, 120);

  const [chaveConta, chaveIp] = await Promise.all([
    chaveDe("login-conta", username),
    chaveDe("login-ip", origem.ip),
  ]);

  const [porConta, porIp] = await Promise.all([
    consultar(chaveConta, LOGIN_POR_CONTA),
    consultar(chaveIp, LOGIN_POR_IP),
  ]);

  const barrado = porConta.bloqueado ? porConta : porIp.bloqueado ? porIp : null;
  if (barrado) {
    await registrarAudit({
      ator,
      acao: "login.limitado",
      resultado: "bloqueado",
      detalhe: porConta.bloqueado ? "teto por conta" : "teto por IP",
      ...origem,
    });
    return NextResponse.json(
      { ok: false, limitado: true, esperarMinutos: minutosLegiveis(barrado.esperarSegundos) },
      { status: 429, headers: { "Retry-After": String(barrado.esperarSegundos) } },
    );
  }

  if (!(await verificarSenha(username, password))) {
    // Sobe as duas dimensões: a distribuída (mesma conta, muitos IPs) e a
    // varredura (muitas contas, mesmo IP).
    await Promise.all([
      registrarTentativa(chaveConta, LOGIN_POR_CONTA),
      registrarTentativa(chaveIp, LOGIN_POR_IP),
    ]);
    await registrarAudit({ ator, acao: "login.falhou", resultado: "bloqueado", ...origem });
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const token = await createSession(username);
  if (!token) {
    // SESSION_SECRET não configurado -> fail closed
    await registrarAudit({
      ator,
      acao: "login.erro",
      resultado: "erro",
      detalhe: "SESSION_SECRET ausente",
      ...origem,
    });
    return NextResponse.json({ ok: false, config: false }, { status: 500 });
  }

  // Só a chave da CONTA é liberada. A do IP segue contando: senão bastaria uma
  // credencial válida qualquer pra zerar o contador entre as rodadas e varrer
  // as outras contas à vontade.
  await limpar(chaveConta);
  await registrarAudit({ ator, acao: "login.ok", resultado: "ok", ...origem });
  await faxinaOportunista();

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}
