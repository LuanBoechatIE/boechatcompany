"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import { usuarios, workShifts, workShiftEvents } from "@/app/lib/db/schema";
import { SESSION_COOKIE, verifySession } from "@/app/lib/auth";
import { exigirPermissao } from "@/app/lib/perms-guard";

type Res = { ok: boolean; erro?: string };

// Data de hoje em America/Sao_Paulo (YYYY-MM-DD).
function hojeSP(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

async function usuarioAtual(): Promise<{ id: number } | null> {
  const c = await cookies();
  const username = await verifySession(c.get(SESSION_COOKIE)?.value);
  if (!username) return null;
  const u = (await getDb().select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.username, username)).limit(1))[0];
  return u ? { id: u.id } : null;
}

async function shiftAbertoHoje(usuarioId: number) {
  return (
    await getDb()
      .select()
      .from(workShifts)
      .where(and(eq(workShifts.usuarioId, usuarioId), eq(workShifts.workDate, hojeSP()), eq(workShifts.status, "aberta")))
      .limit(1)
  )[0] ?? null;
}

type Calc = { worked: number; paused: number; mode: "active" | "pause" | null; desdeISO: string | null };

// Calcula segundos trabalhados (exclui pausas) até `agora`, a partir dos eventos.
function calcular(events: { eventType: string; occurredAt: Date }[], agora: Date): Calc {
  let worked = 0;
  let paused = 0;
  let mode: "active" | "pause" | null = null;
  let cursor: Date | null = null;
  const ordenados = [...events].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
  for (const ev of ordenados) {
    const t = ev.occurredAt;
    if (cursor && mode === "active") worked += (t.getTime() - cursor.getTime()) / 1000;
    if (cursor && mode === "pause") paused += (t.getTime() - cursor.getTime()) / 1000;
    switch (ev.eventType) {
      case "CLOCK_IN":
      case "RESUME":
        mode = "active"; cursor = t; break;
      case "PAUSE":
        mode = "pause"; cursor = t; break;
      case "CLOCK_OUT":
        mode = null; cursor = null; break;
    }
  }
  if (cursor && mode === "active") worked += (agora.getTime() - cursor.getTime()) / 1000;
  if (cursor && mode === "pause") paused += (agora.getTime() - cursor.getTime()) / 1000;
  return { worked: Math.round(worked), paused: Math.round(paused), mode, desdeISO: cursor ? cursor.toISOString() : null };
}

export type PontoView = {
  status: "nao_iniciado" | "trabalhando" | "pausa" | "encerrado";
  workedSeconds: number;
  pausedSeconds: number;
  desdeISO: string | null; // início do período ativo/pausa atual (para o contador)
  inicioLabel: string | null;
  ultimaAcaoLabel: string | null;
};

export async function getMeuPonto(): Promise<PontoView> {
  const u = await usuarioAtual();
  const vazio: PontoView = { status: "nao_iniciado", workedSeconds: 0, pausedSeconds: 0, desdeISO: null, inicioLabel: null, ultimaAcaoLabel: null };
  if (!u) return vazio;
  try {
    const db = getDb();
    const shift = (
      await db.select().from(workShifts).where(and(eq(workShifts.usuarioId, u.id), eq(workShifts.workDate, hojeSP()))).orderBy(asc(workShifts.id)).limit(1)
    )[0];
    if (!shift) return vazio;
    const evs = await db.select().from(workShiftEvents).where(eq(workShiftEvents.shiftId, shift.id)).orderBy(asc(workShiftEvents.occurredAt));
    if (shift.status === "encerrada") {
      return {
        status: "encerrado",
        workedSeconds: shift.totalWorkedSeconds,
        pausedSeconds: shift.totalPausedSeconds,
        desdeISO: null,
        inicioLabel: shift.startedAt ? new Date(shift.startedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : null,
        ultimaAcaoLabel: shift.endedAt ? `Encerrado às ${new Date(shift.endedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : null,
      };
    }
    const c = calcular(evs.map((e) => ({ eventType: e.eventType, occurredAt: e.occurredAt })), new Date());
    const ultima = evs[evs.length - 1];
    const acaoLabel: Record<string, string> = { CLOCK_IN: "Início do expediente", PAUSE: "Em pausa", RESUME: "Retomou", CLOCK_OUT: "Encerrado" };
    return {
      status: c.mode === "pause" ? "pausa" : "trabalhando",
      workedSeconds: c.worked,
      pausedSeconds: c.paused,
      desdeISO: c.desdeISO,
      inicioLabel: shift.startedAt ? new Date(shift.startedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : null,
      ultimaAcaoLabel: ultima ? `${acaoLabel[ultima.eventType] ?? ultima.eventType} · ${new Date(ultima.occurredAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : null,
    };
  } catch {
    return vazio;
  }
}

async function ultimoEvento(shiftId: number) {
  return (
    await getDb().select().from(workShiftEvents).where(eq(workShiftEvents.shiftId, shiftId)).orderBy(asc(workShiftEvents.occurredAt))
  ).at(-1) ?? null;
}

export async function iniciarExpediente(): Promise<Res> {
  const u = await usuarioAtual();
  if (!u) return { ok: false, erro: "Sessão inválida." };
  const db = getDb();
  if (await shiftAbertoHoje(u.id)) return { ok: false, erro: "Você já tem um expediente aberto." };
  const agora = new Date();
  const ins = await db.insert(workShifts).values({ usuarioId: u.id, workDate: hojeSP(), startedAt: agora, status: "aberta" }).returning({ id: workShifts.id });
  await db.insert(workShiftEvents).values({ shiftId: ins[0].id, usuarioId: u.id, eventType: "CLOCK_IN", occurredAt: agora });
  revalidatePath("/admin/crm");
  return { ok: true };
}

export async function pausarPonto(): Promise<Res> {
  const u = await usuarioAtual();
  if (!u) return { ok: false, erro: "Sessão inválida." };
  const shift = await shiftAbertoHoje(u.id);
  if (!shift) return { ok: false, erro: "Nenhum expediente aberto." };
  const ult = await ultimoEvento(shift.id);
  if (!ult || (ult.eventType !== "CLOCK_IN" && ult.eventType !== "RESUME")) return { ok: false, erro: "Você não está trabalhando." };
  await getDb().insert(workShiftEvents).values({ shiftId: shift.id, usuarioId: u.id, eventType: "PAUSE", occurredAt: new Date() });
  revalidatePath("/admin/crm");
  return { ok: true };
}

export async function retomarPonto(): Promise<Res> {
  const u = await usuarioAtual();
  if (!u) return { ok: false, erro: "Sessão inválida." };
  const shift = await shiftAbertoHoje(u.id);
  if (!shift) return { ok: false, erro: "Nenhum expediente aberto." };
  const ult = await ultimoEvento(shift.id);
  if (!ult || ult.eventType !== "PAUSE") return { ok: false, erro: "Você não está em pausa." };
  await getDb().insert(workShiftEvents).values({ shiftId: shift.id, usuarioId: u.id, eventType: "RESUME", occurredAt: new Date() });
  revalidatePath("/admin/crm");
  return { ok: true };
}

export async function encerrarExpediente(): Promise<Res> {
  const u = await usuarioAtual();
  if (!u) return { ok: false, erro: "Sessão inválida." };
  const db = getDb();
  const shift = await shiftAbertoHoje(u.id);
  if (!shift) return { ok: false, erro: "Nenhum expediente aberto." };
  const agora = new Date();
  await db.insert(workShiftEvents).values({ shiftId: shift.id, usuarioId: u.id, eventType: "CLOCK_OUT", occurredAt: agora });
  const evs = await db.select().from(workShiftEvents).where(eq(workShiftEvents.shiftId, shift.id)).orderBy(asc(workShiftEvents.occurredAt));
  const c = calcular(evs.map((e) => ({ eventType: e.eventType, occurredAt: e.occurredAt })), agora);
  const duracaoH = shift.startedAt ? (agora.getTime() - new Date(shift.startedAt).getTime()) / 3_600_000 : 0;
  await db.update(workShifts).set({
    status: "encerrada",
    endedAt: agora,
    totalWorkedSeconds: c.worked,
    totalPausedSeconds: c.paused,
    flagged: duracaoH > 16,
    flagReason: duracaoH > 16 ? "Jornada acima de 16h" : "",
    atualizadoEm: agora,
  }).where(eq(workShifts.id, shift.id));
  revalidatePath("/admin/crm");
  return { ok: true };
}

// ── Visão de equipe: histórico de ponto por funcionário ──────────────────────

export type RegistroPonto = {
  id: number;
  usuarioId: number;
  nome: string;
  workDate: string;
  status: "aberta" | "encerrada";
  inicioLabel: string | null;
  fimLabel: string | null;
  workedSeconds: number;
  pausedSeconds: number;
  flagged: boolean;
  flagReason: string;
};

export type FuncionarioBasico = { id: number; nome: string };

export async function listFuncionariosComPonto(): Promise<FuncionarioBasico[]> {
  await exigirPermissao("time_tracking.view_team");
  const db = getDb();
  const rows = await db
    .selectDistinct({ id: usuarios.id, nomeCompleto: usuarios.nomeCompleto, username: usuarios.username })
    .from(workShifts)
    .innerJoin(usuarios, eq(workShifts.usuarioId, usuarios.id))
    .orderBy(asc(usuarios.nomeCompleto));
  return rows.map((r) => ({ id: r.id, nome: r.nomeCompleto || r.username }));
}

// Lista os registros de ponto (turnos), mais recentes primeiro. Turno ainda
// aberto mostra o tempo acumulado até agora (calculado ao vivo pelos eventos);
// turno encerrado usa os totais já gravados no fechamento.
export async function listRegistrosPonto(filtros?: { usuarioId?: number; de?: string; ate?: string }): Promise<RegistroPonto[]> {
  await exigirPermissao("time_tracking.view_team");
  const db = getDb();

  const condicoes = [];
  if (filtros?.usuarioId) condicoes.push(eq(workShifts.usuarioId, filtros.usuarioId));
  if (filtros?.de) condicoes.push(gte(workShifts.workDate, filtros.de));
  if (filtros?.ate) condicoes.push(lte(workShifts.workDate, filtros.ate));

  const shifts = await db
    .select({
      id: workShifts.id,
      usuarioId: workShifts.usuarioId,
      workDate: workShifts.workDate,
      status: workShifts.status,
      startedAt: workShifts.startedAt,
      endedAt: workShifts.endedAt,
      totalWorkedSeconds: workShifts.totalWorkedSeconds,
      totalPausedSeconds: workShifts.totalPausedSeconds,
      flagged: workShifts.flagged,
      flagReason: workShifts.flagReason,
      nomeCompleto: usuarios.nomeCompleto,
      username: usuarios.username,
    })
    .from(workShifts)
    .innerJoin(usuarios, eq(workShifts.usuarioId, usuarios.id))
    .where(condicoes.length ? and(...condicoes) : undefined)
    .orderBy(desc(workShifts.workDate), desc(workShifts.startedAt))
    .limit(200);

  const hora = (d: Date | null) => (d ? new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : null);

  const out: RegistroPonto[] = [];
  for (const s of shifts) {
    let worked = s.totalWorkedSeconds;
    let paused = s.totalPausedSeconds;
    if (s.status === "aberta") {
      const evs = await db.select().from(workShiftEvents).where(eq(workShiftEvents.shiftId, s.id)).orderBy(asc(workShiftEvents.occurredAt));
      const c = calcular(evs.map((e) => ({ eventType: e.eventType, occurredAt: e.occurredAt })), new Date());
      worked = c.worked;
      paused = c.paused;
    }
    out.push({
      id: s.id,
      usuarioId: s.usuarioId,
      nome: s.nomeCompleto || s.username,
      workDate: s.workDate,
      status: s.status as "aberta" | "encerrada",
      inicioLabel: hora(s.startedAt),
      fimLabel: hora(s.endedAt),
      workedSeconds: worked,
      pausedSeconds: paused,
      flagged: s.flagged,
      flagReason: s.flagReason,
    });
  }
  return out;
}
