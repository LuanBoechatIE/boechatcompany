import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/app/lib/db";

/**
 * Limite de tentativas, em janela fixa, apoiado no Postgres.
 *
 * Sem serviço novo de propósito: o Neon já é obrigatório pro app subir, e o
 * volume de um painel interno cabe folgado numa escrita por tentativa.
 * Trocar por Redis depois muda só este arquivo.
 *
 * ── Por que a chave é hash ───────────────────────────────────────────────────
 * A chave nunca guarda o login tentado nem o IP em claro. Duas razões:
 *   1. Tamanho fixo. Sem isso, alguém enche a tabela mandando logins enormes,
 *      um por linha.
 *   2. Esta tabela não pode virar uma lista legível de quem tentou entrar. Pro
 *      limite funcionar basta saber que a MESMA origem repetiu, não quem é.
 *
 * ── Por que falha ABERTO ─────────────────────────────────────────────────────
 * Se o banco cair, o pedido PASSA. Limite é contenção de abuso, não decisão de
 * autenticação: derrubar o login de todo mundo por causa de um soluço do Neon
 * troca um risco pequeno por uma indisponibilidade certa. A decisão de
 * autenticação em si continua fechando (ver app/lib/auth-db.ts).
 *
 * ── O que este módulo NÃO resolve ────────────────────────────────────────────
 * Duas tentativas realmente simultâneas podem ler o mesmo contador antes de
 * qualquer uma incrementar, então o teto pode ser ultrapassado por uma
 * tentativa. O incremento é atômico, então a contagem não se perde e a
 * seguinte já é barrada. Pra força bruta isso é irrelevante; pra controle de
 * saldo não serviria.
 */

export type Regra = {
  /** Quantas tentativas a janela aceita antes de barrar. */
  teto: number;
  /** Tamanho da janela, em segundos. */
  janelaSegundos: number;
};

export type Veredito = {
  bloqueado: boolean;
  /** Segundos até a janela virar. 0 quando não está bloqueado. */
  esperarSegundos: number;
};

const LIBERADO: Veredito = { bloqueado: false, esperarSegundos: 0 };

// ── Regras ───────────────────────────────────────────────────────────────────
//
// Duas dimensões no login, porque cada uma cobre o furo da outra:
//
//   POR CONTA  segura o ataque distribuído (mesma conta, mil IPs), que é o
//              formato de credential stuffing. É a dimensão que importa.
//   POR IP     segura a varredura (mil contas, mesmo IP). Teto mais alto
//              porque escritório inteiro sai por um IP só, e bloquear a
//              empresa toda por causa de um estagiário errando a senha é pior
//              que o ataque.
export const LOGIN_POR_CONTA: Regra = { teto: 5, janelaSegundos: 15 * 60 };
export const LOGIN_POR_IP: Regra = { teto: 30, janelaSegundos: 15 * 60 };

// Formulários públicos: aqui o contador sobe a TODO envio, não só na falha.
//
// Tetos diferentes porque o custo de cada envio é diferente. Candidatura CRIA
// linha nova a cada vez, então o teto é baixo. O onboarding salva parcial de
// propósito ("o que você já preencheu foi salvo"), e o cliente legítimo volta
// várias vezes no mesmo dia: teto baixo ali viraria suporte, não segurança.
export const CANDIDATURA: Regra = { teto: 5, janelaSegundos: 60 * 60 };
export const ONBOARDING: Regra = { teto: 40, janelaSegundos: 60 * 60 };

// ── Chave ────────────────────────────────────────────────────────────────────

const enc = new TextEncoder();

/**
 * Chave de escopo + hash do identificador.
 *
 * Web Crypto (e não node:crypto) para o módulo continuar utilizável se algum
 * dia isto precisar rodar no edge, como já acontece em app/lib/auth.ts.
 */
export async function chaveDe(escopo: string, identificador: string): Promise<string> {
  const bytes = enc.encode(`${escopo}:${identificador.trim().toLowerCase()}`);
  const resumo = await crypto.subtle.digest("SHA-256", bytes);
  const hex = Array.from(new Uint8Array(resumo).slice(0, 16))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${escopo}:${hex}`;
}

/**
 * IP do cliente, como a Vercel entrega.
 *
 * O IP é rotacionável e o cabeçalho é falsificável fora da borda da Vercel, e
 * por isso o limite POR CONTA é quem realmente segura o ataque. Este aqui
 * atrapalha varredura barata, que é o que ele se propõe a fazer.
 */
export function ipDoPedido(cabecalhos: Headers): string {
  const encaminhado = cabecalhos.get("x-forwarded-for") ?? "";
  const primeiro = encaminhado.split(",")[0]?.trim();
  return cabecalhos.get("x-real-ip") ?? (primeiro || "sem-ip");
}

// ── Consulta e escrita ───────────────────────────────────────────────────────

type LinhaContador = { tentativas: number; restam: number };

/** neon-http devolve { rows }, outros drivers devolvem o array direto. */
function primeiraLinha(resultado: unknown): LinhaContador | null {
  const linhas = Array.isArray(resultado)
    ? resultado
    : ((resultado as { rows?: unknown[] })?.rows ?? []);
  const linha = linhas[0] as Record<string, unknown> | undefined;
  if (!linha) return null;
  return {
    tentativas: Number(linha.tentativas ?? 0),
    restam: Math.max(0, Number(linha.restam ?? 0)),
  };
}

const vereditoDe = (linha: LinhaContador | null, regra: Regra): Veredito =>
  linha && linha.tentativas >= regra.teto
    ? { bloqueado: true, esperarSegundos: linha.restam }
    : LIBERADO;

/**
 * Só CONSULTA, sem incrementar.
 *
 * É o que roda antes de conferir a senha: assim uma chave já bloqueada nem
 * chega a gastar scrypt, que é justamente o custo que o atacante quer impor.
 */
export async function consultar(chave: string, regra: Regra): Promise<Veredito> {
  try {
    const resultado = await getDb().execute(sql`
      select tentativas,
             extract(epoch from (
               janela_inicio + make_interval(secs => ${regra.janelaSegundos}::double precision) - now()
             ))::int as restam
        from rate_limits
       where chave = ${chave}
         and janela_inicio > now() - make_interval(secs => ${regra.janelaSegundos}::double precision)
    `);
    return vereditoDe(primeiraLinha(resultado), regra);
  } catch {
    return LIBERADO; // falha aberto, de propósito
  }
}

/**
 * Incrementa e devolve o veredito já contando esta tentativa.
 *
 * O upsert resolve a expiração sozinho: janela vencida volta o contador pra 1
 * e reabre a janela, então não existe rotina de limpeza pra manter.
 */
export async function registrarTentativa(chave: string, regra: Regra): Promise<Veredito> {
  try {
    const resultado = await getDb().execute(sql`
      insert into rate_limits (chave, tentativas, janela_inicio, atualizado_em)
      values (${chave}, 1, now(), now())
      on conflict (chave) do update set
        tentativas = case
          when rate_limits.janela_inicio < now() - make_interval(secs => ${regra.janelaSegundos}::double precision)
            then 1
          else rate_limits.tentativas + 1
        end,
        janela_inicio = case
          when rate_limits.janela_inicio < now() - make_interval(secs => ${regra.janelaSegundos}::double precision)
            then now()
          else rate_limits.janela_inicio
        end,
        atualizado_em = now()
      returning tentativas,
                extract(epoch from (
                  janela_inicio + make_interval(secs => ${regra.janelaSegundos}::double precision) - now()
                ))::int as restam
    `);
    return vereditoDe(primeiraLinha(resultado), regra);
  } catch {
    return LIBERADO;
  }
}

/**
 * Zera o contador. Chamado no login que deu certo.
 *
 * Limpa só a chave da CONTA. A do IP continua contando: senão bastaria ter uma
 * credencial válida qualquer pra zerar o contador entre as rodadas e varrer as
 * outras contas à vontade.
 */
export async function limpar(chave: string): Promise<void> {
  try {
    await getDb().execute(sql`delete from rate_limits where chave = ${chave}`);
  } catch {
    // Contador preso é chato, não é risco: a janela vence sozinha.
  }
}

/**
 * Faxina das linhas paradas. Idempotente e barata.
 *
 * Chamada de forma oportunista (1 em 100 tentativas) em vez de por cron: a
 * tabela só cresce com chave distinta, e sem isso um atacante variando o login
 * deixaria lixo permanente.
 */
export async function faxinaOportunista(): Promise<void> {
  if (Math.random() > 0.01) return;
  try {
    await getDb().execute(
      sql`delete from rate_limits where janela_inicio < now() - interval '1 day'`,
    );
  } catch {
    // Sem consequência: a próxima tentativa tenta de novo.
  }
}
