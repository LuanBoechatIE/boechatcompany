// Schema do banco (Drizzle + Postgres/Neon).
// Três tabelas: presets (modelos de oferta), clientes, respostas.
import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import type { FieldDef, RespostaValores } from "@/app/lib/onboarding/types";

export const presets = pgTable("presets", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  descricao: text("descricao").notNull().default(""),
  campos: jsonb("campos").$type<FieldDef[]>().notNull().default([]),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

export const clientes = pgTable("clientes", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  contato: text("contato").notNull().default(""),
  presetId: integer("preset_id")
    .notNull()
    .references(() => presets.id, { onDelete: "restrict" }),
  token: text("token").notNull().unique(),
  // criado | respondido | reaberto
  status: text("status").notNull().default("criado"),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  respondidoEm: timestamp("respondido_em", { withTimezone: true }),
});

export const respostas = pgTable("respostas", {
  clienteId: integer("cliente_id")
    .primaryKey()
    .references(() => clientes.id, { onDelete: "cascade" }),
  valores: jsonb("valores").$type<RespostaValores>().notNull().default({}),
  enviadoEm: timestamp("enviado_em", { withTimezone: true }).notNull().defaultNow(),
});

export type Preset = typeof presets.$inferSelect;
export type Cliente = typeof clientes.$inferSelect;
export type Resposta = typeof respostas.$inferSelect;
