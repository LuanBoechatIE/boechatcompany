// Upload de anexos de um lead — upload direto do navegador pro Blob.
//
// Fica sob /admin/*, então o middleware já exige sessão de admin válida
// (fail-closed). O navegador pede um token aqui e sobe direto pro Blob store.
// Precisa da variável BLOB_READ_WRITE_TOKEN (injetada ao conectar o Blob).
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB por arquivo

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
          "image/gif",
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "text/plain",
          "text/csv",
        ],
        maximumSizeInBytes: MAX_BYTES,
        addRandomSuffix: true,
      }),
      onUploadCompleted: async () => {
        // A referência é salva pela server action ao concluir.
      },
    });
    return NextResponse.json(json);
  } catch (e) {
    console.error("[admin/api/upload-lead] falhou:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha no upload." },
      { status: 400 },
    );
  }
}
