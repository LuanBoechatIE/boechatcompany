// Upload dos arquivos do onboarding — upload direto do navegador pro Blob.
//
// O arquivo NÃO passa pelo nosso servidor (por isso aguenta arquivos grandes,
// sem esbarrar no limite de ~4.5MB de request das funções da Vercel): o
// navegador pede um token aqui e sobe direto pro Blob store.
//
// Segurança: só libera pra um cliente real que ainda não travou o envio.
// O acesso (public/private) vem da configuração do Blob store na Vercel — o
// store deste projeto é público, então os arquivos ficam acessíveis por URL.
//
// Precisa da variável BLOB_READ_WRITE_TOKEN (injetada ao conectar o Blob store)
// e da DATABASE_URL (Neon) pra validar o link do cliente.
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import { clientes } from "@/app/lib/db/schema";

// Precisa bater com TAMANHO_MAX_MB em app/onboarding/[token]/OnboardingForm.tsx.
const MAX_BYTES = 24 * 1024 * 1024; // 24 MB por arquivo

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
          maximumSizeInBytes: MAX_BYTES,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // Nada a fazer: a URL é guardada no formulário e enviada no submit.
      },
    });

    return NextResponse.json(json);
  } catch (e) {
    // A causa real (ex.: token do Blob ausente, banco fora do ar) fica aqui
    // nos logs da função — Vercel → Deployments → Functions.
    console.error("[onboarding/api/upload] falhou:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha no upload." },
      { status: 400 },
    );
  }
}
