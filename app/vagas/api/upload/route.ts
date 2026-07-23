// Upload dos arquivos da candidatura (currículo, portfólio etc.) — mesmo
// padrão de /onboarding/api/upload, via helper compartilhado.
// Precisa de BLOB_READ_WRITE_TOKEN e DATABASE_URL (valida a vaga pelo token).
import { eq } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import { vagas } from "@/app/lib/db/schema";
import { processarUploadBlob } from "@/app/lib/blob/upload-helper";

// Precisa bater com TAMANHO_MAX_MB em app/vagas/[token]/VagaApplyForm.tsx.
const MAX_BYTES = 24 * 1024 * 1024; // 24 MB por arquivo

export async function POST(request: Request) {
  return processarUploadBlob(request, {
    logTag: "vagas/api/upload",
    onBeforeGenerateToken: async (_pathname, clientPayload) => {
      const token = (clientPayload ?? "").trim();
      if (!token) throw new Error("Link inválido.");

      const rows = await getDb()
        .select({ status: vagas.status })
        .from(vagas)
        .where(eq(vagas.token, token))
        .limit(1);
      const vaga = rows[0];
      if (!vaga) throw new Error("Vaga não encontrada.");
      if (vaga.status !== "aberta") throw new Error("Esta vaga não está mais recebendo candidaturas.");

      return {
        allowedContentTypes: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "image/*",
          "video/*",
          "application/zip",
        ],
        maximumSizeInBytes: MAX_BYTES,
        addRandomSuffix: true,
      };
    },
  });
}
