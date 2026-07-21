// Client do banco (Neon HTTP + Drizzle).
// Lazy: só conecta na 1ª query, em runtime. Assim o build não quebra se a
// variável de ambiente ainda não estiver setada.
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

type DB = NeonHttpDatabase<typeof schema>;

let _db: DB | null = null;

export function dbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL ?? process.env.POSTGRES_URL);
}

export function getDb(): DB {
  if (_db) return _db;
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url) {
    throw new Error(
      "Banco não configurado: defina DATABASE_URL (ou POSTGRES_URL) na Vercel.",
    );
  }
  _db = drizzle(neon(url), { schema });
  return _db;
}

export { schema };
