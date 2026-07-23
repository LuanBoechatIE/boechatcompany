// Helper compartilhado pras rotas de upload direto-pro-Blob (Vercel Blob
// client-side). Cada rota só define a validação (quem pode subir o quê) e o
// helper cuida do handleUpload + formatação de erro, que era duplicado em
// cada rota (`/onboarding/api/upload`, `/admin/api/upload-lead`, etc.).
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export async function processarUploadBlob(
  request: Request,
  opts: {
    logTag: string;
    onBeforeGenerateToken: (
      pathname: string,
      clientPayload: string | null,
    ) => Promise<{
      allowedContentTypes: string[];
      maximumSizeInBytes: number;
      addRandomSuffix?: boolean;
    }>;
    onUploadCompleted?: () => Promise<void>;
  },
): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: opts.onBeforeGenerateToken,
      onUploadCompleted: opts.onUploadCompleted ?? (async () => {}),
    });
    return NextResponse.json(json);
  } catch (e) {
    // A causa real (token do Blob ausente, banco fora do ar) fica nos logs
    // da função — Vercel → Deployments → Functions.
    console.error(`[${opts.logTag}] falhou:`, e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha no upload." },
      { status: 400 },
    );
  }
}
