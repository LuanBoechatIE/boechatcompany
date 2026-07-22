"use server";

import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import { crmClientes, integracoes } from "@/app/lib/db/schema";
import { decryptSecrets } from "@/app/lib/crm/crypto";
import { getMetaPainel } from "@/app/lib/trafego/meta";
import { getGooglePainel } from "@/app/lib/trafego/google";
import { isRangeValido } from "@/app/lib/trafego/periodo";
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

// Converte uma imagem (logo do cliente, hospedada no Blob) em data URL,
// evitando problemas de CORS na hora de exportar o painel como PNG.
export async function getLogoDataUrl(url: string): Promise<string | null> {
  const limpo = (url ?? "").trim();
  if (!limpo || !/^https?:\/\//.test(limpo)) return null;
  try {
    const res = await fetch(limpo, { cache: "no-store" });
    if (!res.ok) return null;
    const tipo = res.headers.get("content-type") ?? "image/png";
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.byteLength > 5 * 1024 * 1024) return null; // limite de segurança
    return `data:${tipo};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}
