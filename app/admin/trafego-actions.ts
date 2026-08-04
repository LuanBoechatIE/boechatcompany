"use server";

import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import { crmClientes, integracoes } from "@/app/lib/db/schema";
import { decryptSecrets } from "@/app/lib/crm/crypto";
import { getMetaPainel } from "@/app/lib/trafego/meta";
import { getGooglePainel } from "@/app/lib/trafego/google";
import { isRangeValido } from "@/app/lib/trafego/periodo";
import { exigirPermissao } from "@/app/lib/perms-guard";
import type { TrafegoResumo } from "@/app/lib/trafego/types";

export type ClienteTrafego = {
  id: number;
  nome: string;
  empresa: string;
  logo: string;
};

export type TrafegoPainelResult = {
  ok: boolean;
  erro?: string;
  meta: TrafegoResumo;
  google: TrafegoResumo;
  geradoEmISO: string;
  ultimaSyncLabel: string | null;
};

const VAZIO: TrafegoResumo = { status: "nao_configurado", faltando: [] };

// Lista os clientes cadastrados pro seletor do painel.
export async function listClientesTrafego(): Promise<ClienteTrafego[]> {
  await exigirPermissao("trafego.visualizar");
  const rows = await getDb()
    .select({
      id: crmClientes.id,
      nome: crmClientes.nome,
      empresa: crmClientes.empresa,
      logo: crmClientes.logo,
    })
    .from(crmClientes)
    .orderBy(asc(crmClientes.nome));
  return rows;
}

async function carregarIntegracao(clienteId: number, plataforma: "meta" | "google") {
  const rows = await getDb()
    .select()
    .from(integracoes)
    .where(
      and(eq(integracoes.clienteId, clienteId), eq(integracoes.plataforma, plataforma)),
    )
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    dados: (row.dados ?? {}) as Record<string, string>,
    segredos: decryptSecrets(row.segredos ?? ""),
    ultimaSync: row.ultimaSync ?? null,
  };
}

// Busca o painel completo (Meta + Google) de um cliente no intervalo pedido.
// Nunca devolve tokens: só métricas agregadas.
export async function getTrafegoPainel(
  clienteId: number,
  from: string,
  to: string,
): Promise<TrafegoPainelResult> {
  await exigirPermissao("trafego.visualizar");
  const base: TrafegoPainelResult = {
    ok: false,
    meta: VAZIO,
    google: VAZIO,
    geradoEmISO: new Date().toISOString(),
    ultimaSyncLabel: null,
  };

  if (!clienteId || Number.isNaN(clienteId)) {
    return { ...base, erro: "Selecione um cliente." };
  }
  if (!isRangeValido(from, to)) {
    return { ...base, erro: "Período inválido." };
  }

  try {
    const [metaInt, googleInt] = await Promise.all([
      carregarIntegracao(clienteId, "meta"),
      carregarIntegracao(clienteId, "google"),
    ]);

    const [meta, google] = await Promise.all([
      metaInt
        ? getMetaPainel(metaInt.dados, metaInt.segredos, from, to)
        : Promise.resolve<TrafegoResumo>(VAZIO),
      googleInt
        ? getGooglePainel(googleInt.dados, googleInt.segredos, from, to)
        : Promise.resolve<TrafegoResumo>(VAZIO),
    ]);

    const ultimaSync =
      [metaInt?.ultimaSync, googleInt?.ultimaSync]
        .filter((d): d is Date => !!d)
        .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

    return {
      ok: true,
      meta,
      google,
      geradoEmISO: new Date().toISOString(),
      ultimaSyncLabel: ultimaSync
        ? new Date(ultimaSync).toLocaleString("pt-BR")
        : null,
    };
  } catch (e) {
    return {
      ...base,
      erro: e instanceof Error ? e.message : "Falha ao carregar o painel.",
    };
  }
}

/**
 * Converte a logo do cliente em data URL, pro export do painel como PNG não
 * esbarrar em CORS.
 *
 * Esta função faz o SERVIDOR buscar uma URL e devolve o corpo inteiro pra quem
 * pediu. Sem as travas abaixo isso é um SSRF com leitura de resposta: dá pra
 * ler serviço interno, e dá pra usar a Boechat como proxy anônimo pra
 * qualquer endereço da internet.
 *
 * O que segura, e por que cada uma é necessária:
 *
 *   permissão      não existe motivo pra quem não vê Tráfego disparar busca
 *                  de saída a partir do servidor.
 *   só https       http:// alcança rede interna com mais facilidade.
 *   allowlist      a trava principal. Só o Blob, que é de onde a logo vem
 *                  (LogoUploader -> /admin/api/upload-logo -> Vercel Blob).
 *   redirect error  sem isto a allowlist é contornável: basta um host
 *                  permitido responder 302 apontando pra dentro.
 *   teto ANTES     o código antigo checava o tamanho DEPOIS de baixar, o que
 *                  não protegia de nada: o custo já tinha sido pago.
 *   timeout        host interno que não responde prenderia a função até o
 *                  limite da Vercel.
 */

// Hosts do Vercel Blob. Logo hospedada em outro lugar entra aqui de propósito:
// allowlist que se edita sem pensar deixa de ser allowlist.
const HOSTS_DE_LOGO = [".public.blob.vercel-storage.com", ".blob.vercel-storage.com"];

const LOGO_MAX_BYTES = 5 * 1024 * 1024;
const LOGO_TIMEOUT_MS = 5000;
const TIPOS_DE_LOGO = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

function hostLiberado(host: string): boolean {
  return HOSTS_DE_LOGO.some((sufixo) => host.endsWith(sufixo));
}

export async function getLogoDataUrl(url: string): Promise<string | null> {
  await exigirPermissao("trafego.visualizar");

  let alvo: URL;
  try {
    alvo = new URL((url ?? "").trim());
  } catch {
    return null;
  }
  if (alvo.protocol !== "https:") return null;
  if (!hostLiberado(alvo.hostname)) return null;

  try {
    const res = await fetch(alvo, {
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(LOGO_TIMEOUT_MS),
    });
    if (!res.ok) return null;

    // Só o tipo declarado importa aqui: o resultado vira src de <img>, e
    // tipo fora desta lista (SVG, HTML) não tem por que virar logo.
    const tipo = (res.headers.get("content-type") ?? "").split(";")[0]!.trim();
    if (!TIPOS_DE_LOGO.has(tipo)) return null;

    const tamanho = Number(res.headers.get("content-length") ?? 0);
    if (tamanho > LOGO_MAX_BYTES) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    // Rede de segurança: content-length pode vir ausente ou mentindo.
    if (buffer.byteLength > LOGO_MAX_BYTES) return null;

    return `data:${tipo};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}
