// Upload da logo do cliente — upload direto do navegador pro Blob.
//
// Fica sob /admin/*, então o middleware já exige sessão de admin válida
// (fail-closed). O navegador pede um token aqui e sobe direto pro Blob store,
// cujo acesso público vem da configuração do store na Vercel.
//
// Precisa das variáveis BLOB_READ_WRITE_TOKEN (injetada ao conectar o Blob).
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB por logo

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          "image/png",
          "image/jpeg",
          "image/webp",
          "image/svg+xml",
        ],
        maximumSizeInBytes: MAX_BYTES,
        addRandomSuffix: true,
      }),
      onUploadCompleted: async () => {
        // Nada a fazer: a URL é salva pela server action ao concluir.
      },
    });
    return NextResponse.json(json);
  } catch (e) {
    console.error("[admin/api/upload-logo] falhou:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha no upload." },
      { status: 400 },
    );
  }
}
