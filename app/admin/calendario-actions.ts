"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { and, desc, eq, gte, ilike, isNotNull, lte } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import {
  googleCalendarConnections,
  calendarEvents,
  calendarEventAttendees,
  calendarEventIntegrations,
  calendarSyncLogs,
  demandas,
  tarefas,
  projetos,
  crmClientes,
  usuarios,
} from "@/app/lib/db/schema";
import { SESSION_COOKIE, verifySession } from "@/app/lib/auth";
import { exigirPermissao, exigirSuperAdmin } from "@/app/lib/perms-guard";
import { emitirChamadaRapida } from "@/app/lib/realtime/eventos";
import { googleConfigured, faltandoGoogleEnv } from "@/app/lib/google/oauth";
import {
  listarEventos,
  criarEventoGoogle,
  excluirEventoGoogle,
  extrairMeetLink,
  inicioDe,
  SyncTokenInvalido,
  TokenRevogado,
  type ConexaoRow,
  type EventoInput,
} from "@/app/lib/google/calendar";

const TZ = "America/Sao_Paulo";
const CAL_PATH = "/admin/crm/calendario";

async function autorAtual(): Promise<string> {
  const c = await cookies();
  return (await verifySession(c.get(SESSION_COOKIE)?.value)) ?? "desconhecido";
}

async function conexaoAtiva(): Promise<ConexaoRow | null> {
  const rows = await getDb()
    .select()
    .from(googleCalendarConnections)
    .orderBy(desc(googleCalendarConnections.id))
    .limit(1);
  const c = rows[0];
  return c && c.status !== "desconectado" ? c : null;
}

// ── Estado da conexão (sem expor tokens) ─────────────────────────────────────

export type ConexaoView = {
  configurado: boolean;
  faltando: string[];
  conectado: boolean;
  email: string;
  calendarId: string;
  status: string;
  ultimaSyncLabel: string | null;
  connectedBy: string;
};

export async function getConexaoView(): Promise<ConexaoView> {
  const rows = await getDb()
    .select()
    .from(googleCalendarConnections)
    .orderBy(desc(googleCalendarConnections.id))
    .limit(1);
  const c = rows[0];
  const conectado = !!c && c.status !== "desconectado";
  return {
    configurado: googleConfigured(),
    faltando: faltandoGoogleEnv(),
    conectado,
    email: c?.googleAccountEmail ?? "",
    calendarId: c?.calendarId ?? "primary",
    status: c?.status ?? "desconectado",
    ultimaSyncLabel: c?.lastSyncedAt ? new Date(c.lastSyncedAt).toLocaleString("pt-BR") : null,
    connectedBy: c?.connectedBy ?? "",
  };
}

export async function desconectarGoogle(): Promise<void> {
  const c = await conexaoAtiva();
  if (!c) return;
  const quem = await autorAtual();
  await getDb()
    .update(googleCalendarConnections)
    .set({
      status: "desconectado",
      encryptedAccessToken: "",
      encryptedRefreshToken: "",
      syncToken: "",
      connectedBy: quem,
      atualizadoEm: new Date(),
    })
    .where(eq(googleCalendarConnections.id, c.id));
  await log(c.id, "config", "desconectar", "ok", `Desconectado por ${quem}`);
  revalidatePath(CAL_PATH);
}

async function log(
  connectionId: number | null,
  direction: string,
  action: string,
  status: string,
  message = "",
  googleEventId = "",
  internalEventId?: number,
): Promise<void> {
  await getDb().insert(calendarSyncLogs).values({
    connectionId: connectionId ?? undefined,
    direction,
    action,
    status,
    message,
    googleEventId,
    internalEventId,
    finishedAt: new Date(),
  });
}

// ── Sincronização Google → BOECHAT ───────────────────────────────────────────

export type SyncResumo = {
  ok: boolean;
  erro?: string;
  atualizados: number;
  cancelados: number;
  precisaReconectar?: boolean;
};

export async function sincronizarAgora(): Promise<SyncResumo> {
  const c = await conexaoAtiva();
  if (!c) return { ok: false, erro: "Conta não conectada.", atualizados: 0, cancelados: 0 };

  try {
    let usouSyncToken = !!c.syncToken;
    let lista;
    try {
      lista = await listarEventos(
        c,
        usouSyncToken
          ? { syncToken: c.syncToken }
          : { timeMin: new Date(Date.now() - 90 * 86400000).toISOString() },
      );
    } catch (e) {
      if (e instanceof SyncTokenInvalido) {
        // Token expirado: limpa e faz sync completa (evita duplicar).
        usouSyncToken = false;
        lista = await listarEventos(c, {
          timeMin: new Date(Date.now() - 90 * 86400000).toISOString(),
        });
      } else {
        throw e;
      }
    }

    let atualizados = 0;
    let cancelados = 0;
    const db = getDb();

    for (const ev of lista.eventos) {
      const priv = ev.extendedProperties?.private ?? {};
      const origemBoechat = !!priv.boechatEntityId || !!priv.boechatEventId;

      // Já existe vínculo pra esse googleEventId?
      const vinc = (
        await db
          .select()
          .from(calendarEventIntegrations)
          .where(
            and(
              eq(calendarEventIntegrations.connectionId, c.id),
              eq(calendarEventIntegrations.googleEventId, ev.id),
            ),
          )
          .limit(1)
      )[0];

      if (ev.status === "cancelled") {
        if (vinc?.calendarEventId) {
          await db
            .update(calendarEvents)
            .set({ status: "cancelado", atualizadoEm: new Date() })
            .where(eq(calendarEvents.id, vinc.calendarEventId));
          cancelados++;
        }
        continue;
      }

      const { start, end, allDay } = inicioDe(ev);
      const dados = {
        title: ev.summary ?? "(sem título)",
        description: ev.description ?? "",
        location: ev.location ?? "",
        startAt: start,
        endAt: end,
        allDay,
        timezone: TZ,
        meetLink: extrairMeetLink(ev),
        recurrenceRule: ev.recurrence?.[0] ?? "",
        status: "confirmado" as const,
        source: origemBoechat ? ("boechat" as const) : ("google" as const),
        atualizadoEm: new Date(),
      };

      let eventId = vinc?.calendarEventId ?? null;
      if (eventId) {
        await db.update(calendarEvents).set(dados).where(eq(calendarEvents.id, eventId));
      } else {
        const inserido = await db
          .insert(calendarEvents)
          .values({
            ...dados,
            type: origemBoechat ? "evento" : "evento",
            createdBy: "google",
            updatedBy: "google",
          })
          .returning({ id: calendarEvents.id });
        eventId = inserido[0].id;
      }

      // Convidados (status de resposta).
      if (ev.attendees?.length && eventId) {
        await db.delete(calendarEventAttendees).where(eq(calendarEventAttendees.eventId, eventId));
        await db.insert(calendarEventAttendees).values(
          ev.attendees.map((a) => ({
            eventId: eventId as number,
            name: a.displayName ?? "",
            email: a.email,
            optional: !!a.optional,
            responseStatus: a.responseStatus ?? "needsAction",
          })),
        );
      }

      // Vínculo (anti-duplicidade).
      if (vinc) {
        await db
          .update(calendarEventIntegrations)
          .set({
            googleEtag: ev.etag ?? "",
            googleUpdatedAt: ev.updated ? new Date(ev.updated) : null,
            lastSyncDirection: "google_to_boechat",
            lastSyncedAt: new Date(),
            atualizadoEm: new Date(),
          })
          .where(eq(calendarEventIntegrations.id, vinc.id));
      } else {
        await db.insert(calendarEventIntegrations).values({
          calendarEventId: eventId,
          entityType: "evento",
          entityId: eventId,
          connectionId: c.id,
          googleEventId: ev.id,
          googleCalendarId: c.calendarId,
          googleEtag: ev.etag ?? "",
          googleUpdatedAt: ev.updated ? new Date(ev.updated) : null,
          lastSyncDirection: "google_to_boechat",
          lastSyncedAt: new Date(),
        });
      }
      atualizados++;
    }

    await db
      .update(googleCalendarConnections)
      .set({
        syncToken: lista.nextSyncToken ?? "",
        lastSyncedAt: new Date(),
        status: "conectado",
        atualizadoEm: new Date(),
      })
      .where(eq(googleCalendarConnections.id, c.id));

    await log(c.id, "google_to_boechat", usouSyncToken ? "incremental" : "full", "ok", `${atualizados} atualizados, ${cancelados} cancelados`);
    revalidatePath(CAL_PATH);
    return { ok: true, atualizados, cancelados };
  } catch (e) {
    const revogado = e instanceof TokenRevogado;
    await log(c.id, "google_to_boechat", "sync", "erro", revogado ? "token revogado" : "falha");
    return {
      ok: false,
      erro: revogado ? "Autorização expirada. Reconecte a conta." : "Falha ao sincronizar.",
      atualizados: 0,
      cancelados: 0,
      precisaReconectar: revogado,
    };
  }
}

// ── Itens do calendário (mesclado, serializável pro client) ──────────────────

export type CalendarItem = {
  id: string;
  kind: "reuniao" | "evento" | "demanda" | "tarefa" | "prazo";
  source: "boechat" | "google";
  title: string;
  startISO: string;
  endISO: string;
  allDay: boolean;
  responsavel?: string;
  clienteNome?: string;
  projetoNome?: string;
  status?: string;
  prioridade?: string;
  meetLink?: string;
  location?: string;
  description?: string;
  href?: string;
  atrasado?: boolean;
  concluido?: boolean;
  googleEventId?: string;
  eventoId?: number;
};

export async function getCalendarItems(fromISO: string, toISO: string): Promise<CalendarItem[]> {
  const db = getDb();
  const from = new Date(fromISO);
  const to = new Date(toISO);
  const agora = Date.now();

  const [evs, dems, tars, projs, clientes] = await Promise.all([
    db
      .select()
      .from(calendarEvents)
      .where(and(gte(calendarEvents.startAt, from), lte(calendarEvents.startAt, to), eq(calendarEvents.status, "confirmado"))),
    db.select().from(demandas).where(isNotNull(demandas.prazo)),
    db.select().from(tarefas).where(isNotNull(tarefas.prazo)),
    db.select().from(projetos).where(isNotNull(projetos.prazo)),
    db.select({ id: crmClientes.id, nome: crmClientes.nome }).from(crmClientes),
  ]);

  const nomeCliente = new Map(clientes.map((c) => [c.id, c.nome]));
  const items: CalendarItem[] = [];

  for (const e of evs) {
    items.push({
      id: `ev${e.id}`,
      kind: (e.type as CalendarItem["kind"]) === "reuniao" ? "reuniao" : "evento",
      source: e.source === "google" ? "google" : "boechat",
      title: e.title,
      startISO: e.startAt.toISOString(),
      endISO: e.endAt.toISOString(),
      allDay: e.allDay,
      meetLink: e.meetLink || undefined,
      location: e.location || undefined,
      description: e.description || undefined,
      clienteNome: e.clienteId ? nomeCliente.get(e.clienteId) : undefined,
      eventoId: e.id,
    });
  }

  const dentro = (d: Date) => d >= from && d <= to;

  for (const d of dems) {
    const prazo = d.prazo as Date;
    if (!dentro(prazo)) continue;
    const concluido = d.status === "concluido";
    items.push({
      id: `dem${d.id}`,
      kind: "demanda",
      source: "boechat",
      title: d.titulo,
      startISO: prazo.toISOString(),
      endISO: prazo.toISOString(),
      allDay: true,
      responsavel: d.responsavel || undefined,
      clienteNome: d.clienteId ? nomeCliente.get(d.clienteId) : undefined,
      status: d.status,
      prioridade: d.prioridade,
      description: d.descricao || undefined,
      href: "/admin/crm/demandas",
      atrasado: !concluido && prazo.getTime() < agora,
      concluido,
    });
  }

  for (const t of tars) {
    const prazo = t.prazo as Date;
    if (!dentro(prazo)) continue;
    const concluido = t.status === "done";
    items.push({
      id: `tar${t.id}`,
      kind: "tarefa",
      source: "boechat",
      title: t.titulo,
      startISO: prazo.toISOString(),
      endISO: prazo.toISOString(),
      allDay: true,
      responsavel: t.responsavel || undefined,
      status: t.status,
      prioridade: t.prioridade,
      href: `/admin/crm/projetos/${t.projetoId}`,
      atrasado: !concluido && prazo.getTime() < agora,
      concluido,
    });
  }

  for (const p of projs) {
    const prazo = p.prazo as Date;
    if (!dentro(prazo)) continue;
    const concluido = p.status === "concluido";
    items.push({
      id: `proj${p.id}`,
      kind: "prazo",
      source: "boechat",
      title: `Prazo: ${p.nome}`,
      startISO: prazo.toISOString(),
      endISO: prazo.toISOString(),
      allDay: true,
      clienteNome: p.clienteId ? nomeCliente.get(p.clienteId) : undefined,
      status: p.status,
      href: `/admin/crm/projetos/${p.id}`,
      atrasado: !concluido && prazo.getTime() < agora,
      concluido,
    });
  }

  return items.sort((a, b) => a.startISO.localeCompare(b.startISO));
}

// ── Criar / editar / excluir evento (BOECHAT → Google) ───────────────────────

export type NovoEventoInput = {
  type: "reuniao" | "evento" | "demanda" | "tarefa";
  title: string;
  description?: string;
  clienteId?: number | null;
  projetoId?: number | null;
  allDay: boolean;
  startISO: string;
  endISO: string;
  location?: string;
  attendees?: { email: string; optional?: boolean; name?: string }[];
  recurrenceRule?: string;
  reminders?: number[];
  criarMeet?: boolean;
  sincronizarGoogle?: boolean;
  enviarConvites?: boolean;
};

export type EventoResultado = {
  ok: boolean;
  erro?: string;
  eventoId?: number;
  meetLink?: string;
  meetPendente?: boolean;
};

export async function criarEvento(input: NovoEventoInput): Promise<EventoResultado> {
  await exigirPermissao("calendario.criar");
  if (!input.title?.trim()) return { ok: false, erro: "Informe um título." };
  if (new Date(input.startISO) > new Date(input.endISO)) {
    return { ok: false, erro: "O início deve ser antes do fim." };
  }
  const quem = await autorAtual();
  const db = getDb();

  const inserido = await db
    .insert(calendarEvents)
    .values({
      title: input.title.trim(),
      description: input.description ?? "",
      type: input.type,
      clienteId: input.clienteId ?? null,
      projetoId: input.projetoId ?? null,
      organizerUserId: quem,
      startAt: new Date(input.startISO),
      endAt: new Date(input.endISO),
      allDay: input.allDay,
      timezone: TZ,
      location: input.location ?? "",
      recurrenceRule: input.recurrenceRule ?? "",
      source: "boechat",
      createdBy: quem,
      updatedBy: quem,
    })
    .returning({ id: calendarEvents.id });
  const eventoId = inserido[0].id;

  if (input.attendees?.length) {
    await db.insert(calendarEventAttendees).values(
      input.attendees.map((a) => ({
        eventId: eventoId,
        email: a.email,
        name: a.name ?? "",
        optional: !!a.optional,
      })),
    );
  }

  // Sincroniza com o Google se pedido e houver conta conectada.
  const conn = input.sincronizarGoogle ? await conexaoAtiva() : null;
  if (!conn) return { ok: true, eventoId };

  const criarMeet = input.type === "reuniao" && input.criarMeet !== false;
  const evInput: EventoInput = {
    title: input.title.trim(),
    description: input.description,
    location: input.location,
    allDay: input.allDay,
    startISO: input.startISO,
    endISO: input.endISO,
    timezone: TZ,
    attendees: input.attendees,
    recurrenceRule: input.recurrenceRule,
    reminders: input.reminders,
    criarMeet,
    refs: {
      boechatEntityType: "evento",
      boechatEntityId: String(eventoId),
      boechatEventId: String(eventoId),
      boechatClientId: input.clienteId ? String(input.clienteId) : "",
    },
  };

  try {
    const sendUpdates = input.enviarConvites === false ? "none" : "all";
    const ev = await criarEventoGoogle(conn, evInput, sendUpdates);
    const meetLink = extrairMeetLink(ev);
    await db.insert(calendarEventIntegrations).values({
      calendarEventId: eventoId,
      entityType: "evento",
      entityId: eventoId,
      connectionId: conn.id,
      googleEventId: ev.id,
      googleCalendarId: conn.calendarId,
      googleEtag: ev.etag ?? "",
      googleUpdatedAt: ev.updated ? new Date(ev.updated) : null,
      lastSyncDirection: "boechat_to_google",
      lastSyncedAt: new Date(),
    });
    if (meetLink) {
      await db.update(calendarEvents).set({ meetLink }).where(eq(calendarEvents.id, eventoId));
    }
    await log(conn.id, "boechat_to_google", "criar", "ok", "", ev.id, eventoId);
    revalidatePath(CAL_PATH);
    return {
      ok: true,
      eventoId,
      meetLink: meetLink || undefined,
      meetPendente: criarMeet && !meetLink, // Meet ainda sendo gerado
    };
  } catch (e) {
    // O Meet/Google falhou, mas o evento interno permanece salvo.
    await log(conn.id, "boechat_to_google", "criar", "erro", "falha ao criar no Google", "", eventoId);
    return {
      ok: true,
      eventoId,
      erro: "Evento salvo, mas falhou ao criar no Google. Use Sincronizar para tentar de novo.",
    };
  }
}

async function integracaoDoEvento(eventoId: number) {
  const rows = await getDb()
    .select()
    .from(calendarEventIntegrations)
    .where(eq(calendarEventIntegrations.calendarEventId, eventoId))
    .limit(1);
  return rows[0] ?? null;
}

export async function excluirEvento(eventoId: number): Promise<{ ok: boolean; erro?: string }> {
  await exigirPermissao("calendario.excluir");
  const db = getDb();
  const conn = await conexaoAtiva();
  const vinc = await integracaoDoEvento(eventoId);

  if (conn && vinc?.googleEventId) {
    try {
      await excluirEventoGoogle(conn, vinc.googleEventId, "all");
    } catch {
      // Segue removendo internamente mesmo se o Google falhar.
    }
    await log(conn.id, "boechat_to_google", "excluir", "ok", "", vinc.googleEventId, eventoId);
  }
  await db.update(calendarEvents).set({ status: "cancelado", atualizadoEm: new Date() }).where(eq(calendarEvents.id, eventoId));
  revalidatePath(CAL_PATH);
  return { ok: true };
}

// Participantes de um evento (pra exibir no resumo da reunião do lead).
export type ParticipanteView = { nome: string; email: string; optional: boolean };

export async function getEventoAttendees(eventoId: number): Promise<ParticipanteView[]> {
  if (!eventoId) return [];
  const rows = await getDb()
    .select({ name: calendarEventAttendees.name, email: calendarEventAttendees.email, optional: calendarEventAttendees.optional })
    .from(calendarEventAttendees)
    .where(eq(calendarEventAttendees.eventId, eventoId));
  return rows.map((r) => ({ nome: r.name || r.email, email: r.email, optional: r.optional }));
}

// Botão flutuante "chamada rápida" (só admin, ver NotificationBell/AdminShell):
// cria uma reunião instantânea no Meet (reaproveita criarEvento — mesma
// integração Google já usada pro resto do calendário) e avisa a equipe em
// tempo real. Sem Google conectado, a chamada sai sem link de Meet (quem
// chamou ainda pode avisar por fora) — nunca quebra o botão.
export async function iniciarChamadaRapida(): Promise<{ ok: boolean; meetLink?: string; erro?: string }> {
  const ator = await exigirSuperAdmin();
  const db = getDb();

  // Busca por nome (não por username fixo) — username muda (ex.: migração de
  // login pra padrão @boechat.com), nome completo é mais estável.
  const [samuel, chamador] = await Promise.all([
    db.select().from(usuarios).where(ilike(usuarios.nomeCompleto, "samuel%")).limit(1).then((r) => r[0]),
    db.select().from(usuarios).where(eq(usuarios.id, ator.id)).limit(1).then((r) => r[0]),
  ]);
  const nomeChamador = chamador?.nomeCompleto || ator.username;
  const agora = new Date();
  const fim = new Date(agora.getTime() + 30 * 60 * 1000);

  const resultado = await criarEvento({
    title: `Chamada rápida — ${nomeChamador}`,
    type: "reuniao",
    allDay: false,
    startISO: agora.toISOString(),
    endISO: fim.toISOString(),
    criarMeet: true,
    sincronizarGoogle: true,
    enviarConvites: false,
    attendees: samuel?.email ? [{ email: samuel.email, name: samuel.nomeCompleto || "Samuel" }] : [],
  });

  if (samuel) {
    await emitirChamadaRapida(nomeChamador, resultado.meetLink ?? "", samuel.username);
  }

  return {
    ok: true,
    meetLink: resultado.meetLink,
    erro: samuel ? undefined : "Reunião criada, mas não achei o usuário do Samuel pra notificar.",
  };
}
