// Autoriza o upload direto do navegador do cliente pro Vercel Blob.
// O arquivo NÃO passa pelo servidor (evita o limite de body do serverless):
// o cliente pede um token aqui, e sobe direto pro Blob.
//
// Segurança: só libera se o token do onboarding for de um cliente real e que
// ainda não travou (respondido). Assim ninguém de fora usa o endpoint.
//
// Precisa da variável BLOB_READ_WRITE_TOKEN (injetada ao criar o Blob store na Vercel).
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import { clientes } from "@/app/lib/db/schema";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const token = (clientPayload ?? "").trim();
        if (!token) throw new Error("Link inválido.");

        const rows = await getDb()
          .select({ status: clientes.status })
          .from(clientes)
          .where(eq(clientes.token, token))
          .limit(1);
        const cliente = rows[0];
        if (!cliente) throw new Error("Link inválido ou expirado.");
        if (cliente.status === "respondido") {
          throw new Error("Este onboarding já foi respondido.");
        }

        return {
          allowedContentTypes: [
            "image/*",
            "application/pdf",
            "image/svg+xml",
            "application/postscript", // .ai / .eps
            "application/illustrator",
            "application/zip",
            "application/octet-stream",
          ],
          maximumSizeInBytes: 25 * 1024 * 1024, // 25 MB por arquivo
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // Nada a fazer: a URL é guardada no formulário e enviada no submit.
      },
    });

    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha no upload." },
      { status: 400 },
    );
  }
}
