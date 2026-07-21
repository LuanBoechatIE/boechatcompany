import { defineConfig } from "drizzle-kit";

// Só pra devs (drizzle-kit push/generate). Em produção as tabelas nascem do
// app/lib/db/schema.sql rodado uma vez no console do Neon.
export default defineConfig({
  schema: "./app/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? "",
  },
});
