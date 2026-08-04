// Upload da logo do cliente — upload direto do navegador pro Blob.
//
// Fica sob /admin/*, mas NÃO confia só no middleware: exige a permissão dentro
// do handler (M3). SVG saiu da allowlist (M2): SVG é HTML executável e o Blob é
// público, então logo em SVG vira vetor de XSS/distribuição hospedado no domínio.
//
// Precisa das variáveis BLOB_READ_WRITE_TOKEN (injetada ao conectar o Blob).
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { exigirPermissao } from "@/app/lib/perms-guard";

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB por logo

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        await exigirPermissao("clientes.editar");
        return {
        allowedContentTypes: [
          "image/png",
          "image/jpeg",
          "image/webp",
        ],
        maximumSizeInBytes: MAX_BYTES,
        addRandomSuffix: true,
        };
      },
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
