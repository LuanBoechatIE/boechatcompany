import "server-only";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import { googleCalendarConnections } from "@/app/lib/db/schema";
import { encrypt, decrypt } from "@/app/lib/crm/crypto";
import { novoOAuthClient } from "./oauth";

const API = "https://www.googleapis.com/calendar/v3";
const EXPIRY_BUFFER_MS = 60_000; // renova 1 min antes de expirar

export type ConexaoRow = typeof googleCalendarConnections.$inferSelect;

// Erro específico quando o syncToken foi invalidado (HTTP 410).
export class SyncTokenInvalido extends Error {}
// Erro quando a conta perdeu autorização (refresh token revogado/expirado).
export class TokenRevogado extends Error {}

// Garante um access token válido, renovando via refresh token quando preciso.
// Persiste o novo access token/expiração no banco. Nunca loga tokens.
export async function accessTokenValido(conn: ConexaoRow): Promise<string> {
  const agora = Date.now();
  const expira = conn.tokenExpiresAt ? new Date(conn.tokenExpiresAt).getTime() : 0;
  const atual = conn.encryptedAccessToken ? decrypt(conn.encryptedAccessToken) : "";
  if (atual && expira - EXPIRY_BUFFER_MS > agora) return atual;

  const refresh = conn.encryptedRefreshToken ? decrypt(conn.encryptedRefreshToken) : "";
  if (!refresh) throw new TokenRevogado("Sem refresh token. Reconecte a conta.");

  const client = novoOAuthClient();
  client.setCredentials({ refresh_token: refresh });
  try {
    const { token } = await client.getAccessToken();
    if (!token) throw new TokenRevogado("Não foi possível renovar o acesso.");
    const novaExpira = client.credentials.expiry_date ?? agora + 3_600_000;
    await getDb()
      .update(googleCalendarConnections)
      .set({
        encryptedAccessToken: encrypt(token),
        tokenExpiresAt: new Date(novaExpira),
        status: "conectado",
        atualizadoEm: new Date(),
      })
      .where(eq(googleCalendarConnections.id, conn.id));
    return token;
  } catch (e) {
    await getDb()
      .update(googleCalendarConnections)
      .set({ status: "expirado", atualizadoEm: new Date() })
      .where(eq(googleCalendarConnections.id, conn.id));
    throw new TokenRevogado(e instanceof Error ? e.message : "Falha ao renovar o token.");
  }
}

async function chamar(
  conn: ConexaoRow,
  path: string,
  init: RequestInit & { query?: Record<string, string> } = {},
): Promise<unknown> {
  const token = await accessTokenValido(conn);
  const q = init.query ? "?" + new URLSearchParams(init.query).toString() : "";
  const res = await fetch(`${API}${path}${q}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  if (res.status === 410) throw new SyncTokenInvalido("syncToken inválido.");
  if (res.status === 401) throw new TokenRevogado("Autorização inválida.");
  if (res.status === 204) return null;
  const json = (await res.json()) as { error?: { message?: string } };
  if (!res.ok) {
    throw new Error(json?.error?.message ?? `Erro do Google (${res.status}).`);
  }
  return json;
}

// ── Tipos de evento do Google (subconjunto que usamos) ───────────────────────

export type GoogleEventDateTime = { date?: string; dateTime?: string; timeZone?: string };
export type GoogleAttendee = {
  email: string;
  displayName?: string;
  optional?: boolean;
  responseStatus?: string;
  organizer?: boolean;
};
export type GoogleEvent = {
  id: string;
  status?: string; // confirmed|cancelled
  summary?: string;
  description?: string;
  location?: string;
  start?: GoogleEventDateTime;
  end?: GoogleEventDateTime;
  attendees?: GoogleAttendee[];
  organizer?: { email?: string; displayName?: string };
  hangoutLink?: string;
  conferenceData?: {
    entryPoints?: { entryPointType?: string; uri?: string }[];
    conferenceId?: string;
  };
  recurrence?: string[];
  reminders?: { useDefault?: boolean; overrides?: { method: string; minutes: number }[] };
  etag?: string;
  updated?: string;
  htmlLink?: string;
  extendedProperties?: { private?: Record<string, string> };
};

export type ListaEventos = { eventos: GoogleEvent[]; nextSyncToken?: string };

// Lista eventos. Full sync (timeMin/timeMax) ou incremental (syncToken).
export async function listarEventos(
  conn: ConexaoRow,
  opts: { syncToken?: string; timeMin?: string; timeMax?: string },
): Promise<ListaEventos> {
  const eventos: GoogleEvent[] = [];
  let pageToken: string | undefined;
  let nextSyncToken: string | undefined;

  do {
    const query: Record<string, string> = { singleEvents: "false", maxResults: "250" };
    if (opts.syncToken) query.syncToken = opts.syncToken;
    else {
      if (opts.timeMin) query.timeMin = opts.timeMin;
      if (opts.timeMax) query.timeMax = opts.timeMax;
    }
    if (pageToken) query.pageToken = pageToken;

    const data = (await chamar(conn, `/calendars/${encodeURIComponent(conn.calendarId)}/events`, {
      method: "GET",
      query,
    })) as { items?: GoogleEvent[]; nextPageToken?: string; nextSyncToken?: string };

    eventos.push(...(data.items ?? []));
    pageToken = data.nextPageToken;
    nextSyncToken = data.nextSyncToken ?? nextSyncToken;
  } while (pageToken);

  return { eventos, nextSyncToken };
}

// ── Escrita ──────────────────────────────────────────────────────────────────

export type ReferenciasBoechat = {
  boechatEntityType?: string;
  boechatEntityId?: string;
  boechatEventId?: string;
  boechatClientId?: string;
};

export type EventoInput = {
  title: string;
  description?: string;
  location?: string;
  allDay: boolean;
  startISO: string; // ISO com fuso, ou YYYY-MM-DD se allDay
  endISO: string;
  timezone: string;
  attendees?: { email: string; optional?: boolean }[];
  recurrenceRule?: string; // ex.: "RRULE:FREQ=WEEKLY;BYDAY=MO"
  reminders?: number[]; // minutos antes
  criarMeet?: boolean;
  refs?: ReferenciasBoechat;
};

function corpoEvento(input: EventoInput): Record<string, unknown> {
  const start: GoogleEventDateTime = input.allDay
    ? { date: input.startISO.slice(0, 10) }
    : { dateTime: input.startISO, timeZone: input.timezone };
  const end: GoogleEventDateTime = input.allDay
    ? { date: input.endISO.slice(0, 10) }
    : { dateTime: input.endISO, timeZone: input.timezone };

  const body: Record<string, unknown> = {
    summary: input.title,
    description: input.description ?? "",
    location: input.location ?? "",
    start,
    end,
  };
  if (input.attendees?.length) {
    body.attendees = input.attendees.map((a) => ({ email: a.email, optional: !!a.optional }));
  }
  if (input.recurrenceRule) body.recurrence = [input.recurrenceRule];
  if (input.reminders && input.reminders.length > 0) {
    body.reminders = {
      useDefault: false,
      overrides: input.reminders.map((m) => ({ method: "popup", minutes: m })),
    };
  } else {
    body.reminders = { useDefault: true };
  }
  if (input.criarMeet) {
    body.conferenceData = {
      createRequest: {
        requestId: randomUUID(),
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    };
  }
  if (input.refs) {
    const priv: Record<string, string> = {};
    for (const [k, v] of Object.entries(input.refs)) if (v) priv[k] = v;
    if (Object.keys(priv).length) body.extendedProperties = { private: priv };
  }
  return body;
}

export function extrairMeetLink(ev: GoogleEvent): string {
  if (ev.hangoutLink) return ev.hangoutLink;
  const ep = ev.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video");
  return ep?.uri ?? "";
}

export async function criarEventoGoogle(
  conn: ConexaoRow,
  input: EventoInput,
  sendUpdates: "all" | "none" = "all",
): Promise<GoogleEvent> {
  const query: Record<string, string> = { sendUpdates };
  if (input.criarMeet) query.conferenceDataVersion = "1";
  return (await chamar(conn, `/calendars/${encodeURIComponent(conn.calendarId)}/events`, {
    method: "POST",
    query,
    body: JSON.stringify(corpoEvento(input)),
  })) as GoogleEvent;
}

export async function atualizarEventoGoogle(
  conn: ConexaoRow,
  googleEventId: string,
  input: EventoInput,
  sendUpdates: "all" | "none" = "all",
): Promise<GoogleEvent> {
  const query: Record<string, string> = { sendUpdates };
  if (input.criarMeet) query.conferenceDataVersion = "1";
  return (await chamar(
    conn,
    `/calendars/${encodeURIComponent(conn.calendarId)}/events/${encodeURIComponent(googleEventId)}`,
    { method: "PATCH", query, body: JSON.stringify(corpoEvento(input)) },
  )) as GoogleEvent;
}

export async function excluirEventoGoogle(
  conn: ConexaoRow,
  googleEventId: string,
  sendUpdates: "all" | "none" = "all",
): Promise<void> {
  await chamar(
    conn,
    `/calendars/${encodeURIComponent(conn.calendarId)}/events/${encodeURIComponent(googleEventId)}`,
    { method: "DELETE", query: { sendUpdates } },
  );
}

// Converte um evento do Google para o horário/campos usados internamente.
export function inicioDe(ev: GoogleEvent): { start: Date; end: Date; allDay: boolean } {
  const allDay = Boolean(ev.start?.date);
  const start = new Date(ev.start?.dateTime ?? `${ev.start?.date}T00:00:00-03:00`);
  const end = new Date(ev.end?.dateTime ?? `${ev.end?.date}T00:00:00-03:00`);
  return { start, end, allDay };
}
