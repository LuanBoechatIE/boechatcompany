// Upload dos arquivos do onboarding — abordagem server-side.
//
// O arquivo sobe pro NOSSO servidor (multipart/form-data) e daqui vai pro
// Vercel Blob usando o token de leitura/escrita direto (put). Isso evita todo
// o fluxo de "client token" do Blob, que estava falhando com
// "Cannot get store id from token or header".
//
// Limite: a Vercel corta requisições de função acima de ~4.5MB, então cada
// arquivo pode ter no máximo 4MB. Arquivo maior vai pelo WhatsApp.
//
// Precisa da variável BLOB_READ_WRITE_TOKEN (injetada ao conectar o Blob store
// na Vercel) e da DATABASE_URL (Neon) pra validar o link do cliente.
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import { clientes } from "@/app/lib/db/schema";

export const runtime = "nodejs";

const MAX_MB = 4;
const MAX_BYTES = MAX_MB * 1024 * 1024;

function erro(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const form = await request.formData();
    const token = String(form.get("token") ?? "").trim();
    const file = form.get("file");

    if (!token) return erro("Link inválido.");
    if (!(file instanceof File) || file.size === 0) {
      return erro("Nenhum arquivo recebido.");
    }
    if (file.size > MAX_BYTES) {
      return erro(
        `Esse arquivo tem mais de ${MAX_MB}MB. Manda uma versão menor ou envia pelo WhatsApp.`,
      );
    }

    // Só libera pra um cliente real que ainda não travou o envio.
    const rows = await getDb()
      .select({ status: clientes.status })
      .from(clientes)
      .where(eq(clientes.token, token))
      .limit(1);
    const cliente = rows[0];
    if (!cliente) return erro("Link inválido ou expirado.");
    if (cliente.status === "respondido") {
      return erro("Este onboarding já foi respondido.");
    }

    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type || undefined,
    });

    return NextResponse.json({ url: blob.url, nome: file.name });
  } catch (e) {
    // A mensagem real (ex.: token do Blob ausente, banco fora do ar) fica aqui
    // nos logs da função — Vercel → Deployments → Functions.
    console.error("[onboarding/api/upload] falhou:", e);
    return erro(e instanceof Error ? e.message : "Falha no upload.");
  }
}
