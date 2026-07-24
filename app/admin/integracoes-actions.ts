"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { and, eq, desc } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import { integracoes, integracaoLogs } from "@/app/lib/db/schema";
import { SESSION_COOKIE, verifySession } from "@/app/lib/auth";
import { exigirPermissao } from "@/app/lib/perms-guard";
import {
  cryptoConfigured,
  encryptSecrets,
  decryptSecrets,
  mask,
} from "@/app/lib/crm/crypto";
import {
  META_CAMPOS,
  GOOGLE_CAMPOS,
  type IntegracaoView,
} from "@/app/lib/crm/types";

function camposDe(plataforma: string) {
  return plataforma === "meta" ? META_CAMPOS : GOOGLE_CAMPOS;
}

async function autorAtual(): Promise<string> {
  const c = await cookies();
  const token = c.get(SESSION_COOKIE)?.value;
  return (await verifySession(token)) ?? "desconhecido";
}

async function log(clienteId: number, plataforma: string, acao: string) {
  await getDb()
    .insert(integracaoLogs)
    .values({ clienteId, plataforma, acao, autor: await autorAtual() });
}

const dt = (d: Date | null) =>
  d ? new Date(d).toLocaleString("pt-BR") : null;

// Leitura segura pro frontend: NUNCA devolve `segredos`.
export async function getIntegracaoView(
  clienteId: number,
  plataforma: "meta" | "google",
): Promise<IntegracaoView> {
  const db = getDb();
  const rows = await db
    .select()
    .from(integracoes)
    .where(and(eq(integracoes.clienteId, clienteId), eq(integracoes.plataforma, plataforma)))
    .limit(1);
  const row = rows[0];
  const logs = await db
    .select()
    .from(integracaoLogs)
    .where(and(eq(integracaoLogs.clienteId, clienteId), eq(integracaoLogs.plataforma, plataforma)))
    .orderBy(desc(integracaoLogs.criadoEm))
    .limit(5);

  return {
    plataforma,
    dados: row?.dados ?? {},
    mascaras: row?.mascaras ?? {},
    status: row?.status ?? "desconectado",
    ultimaSyncLabel: dt(row?.ultimaSync ?? null),
    tokenExpiraLabel: dt(row?.tokenExpiraEm ?? null),
    atualizadoPor: row?.atualizadoPor ?? "",
    atualizadoEmLabel: dt(row?.atualizadoEm ?? null),
    logs: logs.map((l) => ({
      acao: l.acao,
      autor: l.autor,
      quando: new Date(l.criadoEm).toLocaleString("pt-BR"),
    })),
  };
}

export async function saveIntegracao(formData: FormData): Promise<void> {
  await exigirPermissao("trafego.configurar");
  if (!cryptoConfigured()) return; // fail-closed: sem chave, não salva
  const clienteId = Number(formData.get("clienteId"));
  const plataforma = String(formData.get("plataforma") ?? "");
  if (!clienteId || (plataforma !== "meta" && plataforma !== "google")) return;

  const campos = camposDe(plataforma);
  const db = getDb();
  const existing = (
    await db
      .select()
      .from(integracoes)
      .where(and(eq(integracoes.clienteId, clienteId), eq(integracoes.plataforma, plataforma)))
      .limit(1)
  )[0];

  // Dados não-sensíveis: sobrescreve com o que veio do form.
  const dados: Record<string, string> = {};
  for (const c of campos.dados) {
    dados[c.key] = String(formData.get(c.key) ?? "").trim();
  }

  // Segredos: se o campo veio vazio, mantém o valor já salvo (não apaga).
  const anteriores = decryptSecrets(existing?.segredos ?? "");
  const segredos: Record<string, string> = {};
  for (const c of campos.segredos) {
    const novo = String(formData.get(c.key) ?? "").trim();
    const valor = novo || anteriores[c.key] || "";
    if (valor) segredos[c.key] = valor;
  }

  const mascaras: Record<string, string> = {};
  for (const [k, v] of Object.entries(segredos)) mascaras[k] = mask(v);

  const temSegredo = Object.keys(segredos).length > 0;
  const tokenExpiraEm = (() => {
    const raw = String(formData.get("tokenExpiraEm") ?? "").trim();
    if (!raw) return existing?.tokenExpiraEm ?? null;
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  })();

  const valores = {
    clienteId,
    plataforma,
    dados,
    segredos: temSegredo ? encryptSecrets(segredos) : "",
    mascaras,
    status: existing?.status ?? (temSegredo ? "desconectado" : "desconectado"),
    tokenExpiraEm,
    atualizadoPor: await autorAtual(),
    atualizadoEm: new Date(),
  };

  await db
    .insert(integracoes)
    .values(valores)
    .onConflictDoUpdate({
      target: [integracoes.clienteId, integracoes.plataforma],
      set: {
        dados: valores.dados,
        segredos: valores.segredos,
        mascaras: valores.mascaras,
        tokenExpiraEm: valores.tokenExpiraEm,
        atualizadoPor: valores.atualizadoPor,
        atualizadoEm: valores.atualizadoEm,
      },
    });

  await log(clienteId, plataforma, "salvou");
  revalidatePath(`/admin/crm/clientes/${clienteId}`);
}

export async function disconnectIntegracao(formData: FormData): Promise<void> {
  await exigirPermissao("trafego.configurar");
  const clienteId = Number(formData.get("clienteId"));
  const plataforma = String(formData.get("plataforma") ?? "");
  if (!clienteId || !plataforma) return;
  await getDb()
    .update(integracoes)
    .set({ segredos: "", mascaras: {}, status: "desconectado", atualizadoPor: await autorAtual(), atualizadoEm: new Date() })
    .where(and(eq(integracoes.clienteId, clienteId), eq(integracoes.plataforma, plataforma)));
  await log(clienteId, plataforma, "desconectou");
  revalidatePath(`/admin/crm/clientes/${clienteId}`);
}

// Testa a conexão de verdade. Nunca coloca token em mensagem/log.
async function pingIntegracao(
  plataforma: string,
  dados: Record<string, string>,
  segredos: Record<string, string>,
): Promise<boolean> {
  try {
    if (plataforma === "meta") {
      const token = segredos.accessToken;
      const acct = (dados.adAccountId ?? "").trim();
      if (!token || !acct) return false;
      const id = acct.startsWith("act_") ? acct : `act_${acct}`;
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${id}?fields=name&access_token=${encodeURIComponent(token)}`,
        { cache: "no-store" },
      );
      return res.ok;
    }
    // Google: valida via refresh do OAuth (retorna access_token se ok).
    const { clientId, clientSecret, refreshToken } = segredos;
    if (!clientId || !clientSecret || !refreshToken) return false;
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    });
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function carregarSegredos(clienteId: number, plataforma: string) {
  const rows = await getDb()
    .select()
    .from(integracoes)
    .where(and(eq(integracoes.clienteId, clienteId), eq(integracoes.plataforma, plataforma)))
    .limit(1);
  const row = rows[0];
  return { row, segredos: decryptSecrets(row?.segredos ?? "") };
}

export async function testIntegracao(formData: FormData): Promise<void> {
  await exigirPermissao("trafego.configurar");
  const clienteId = Number(formData.get("clienteId"));
  const plataforma = String(formData.get("plataforma") ?? "");
  if (!clienteId || !plataforma) return;
  const { row, segredos } = await carregarSegredos(clienteId, plataforma);
  const ok = row ? await pingIntegracao(plataforma, row.dados, segredos) : false;
  await getDb()
    .update(integracoes)
    .set({ status: ok ? "conectado" : "erro" })
    .where(and(eq(integracoes.clienteId, clienteId), eq(integracoes.plataforma, plataforma)));
  await log(clienteId, plataforma, "testou");
  revalidatePath(`/admin/crm/clientes/${clienteId}`);
}

export async function syncIntegracao(formData: FormData): Promise<void> {
  await exigirPermissao("trafego.configurar");
  const clienteId = Number(formData.get("clienteId"));
  const plataforma = String(formData.get("plataforma") ?? "");
  if (!clienteId || !plataforma) return;
  const { row, segredos } = await carregarSegredos(clienteId, plataforma);
  const ok = row ? await pingIntegracao(plataforma, row.dados, segredos) : false;
  await getDb()
    .update(integracoes)
    .set({ status: ok ? "conectado" : "erro", ultimaSync: ok ? new Date() : row?.ultimaSync ?? null })
    .where(and(eq(integracoes.clienteId, clienteId), eq(integracoes.plataforma, plataforma)));
  await log(clienteId, plataforma, "sincronizou");
  revalidatePath(`/admin/crm/clientes/${clienteId}`);
}
