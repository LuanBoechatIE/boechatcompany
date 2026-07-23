// Camada de dados do módulo de Recrutamento. Espelha o padrão de
// leads-data.ts: busca os rows brutos e enriquece pra DTOs prontos pra UI.
import { desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import {
  vagas,
  candidaturas,
  candidaturaRespostas,
  cargos,
  presets,
  type Vaga,
  type Candidatura,
} from "@/app/lib/db/schema";
import type { FieldDef, RespostaValores } from "@/app/lib/onboarding/types";
import type { VagaDTO, CandidaturaDTO, VagaModelo, VagaStatus, CandidaturaStatus } from "./types";

const dtBR = (d: Date) =>
  d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

// Lê um valor de `valores` por convenção de LABEL do campo (case-insensitive,
// contém a palavra-chave) — pra exibir "cidade"/"experiência"/"foto" no card
// sem exigir coluna dedicada pra campo dinâmico. Degrada pra "" se não achar.
function porLabel(campos: FieldDef[], valores: RespostaValores, ...palavras: string[]): string {
  const campo = campos.find((c) =>
    palavras.some((p) => c.label.toLowerCase().includes(p)),
  );
  if (!campo) return "";
  return (valores[campo.id] ?? "").split("\n")[0] ?? "";
}

export async function getVagas(): Promise<VagaDTO[]> {
  const db = getDb();
  const rows = await db.select().from(vagas).orderBy(desc(vagas.criadoEm));
  if (rows.length === 0) return [];

  const cargoIds = [...new Set(rows.map((v) => v.cargoId).filter((id): id is number => id != null))];
  const cargoRows = cargoIds.length
    ? await db.select({ id: cargos.id, nome: cargos.nome }).from(cargos).where(inArray(cargos.id, cargoIds))
    : [];
  const cargoNome = new Map(cargoRows.map((c) => [c.id, c.nome]));

  const contagem = await db
    .select({ vagaId: candidaturas.vagaId })
    .from(candidaturas)
    .where(inArray(candidaturas.vagaId, rows.map((v) => v.id)));
  const totalPorVaga = new Map<number, number>();
  for (const c of contagem) totalPorVaga.set(c.vagaId, (totalPorVaga.get(c.vagaId) ?? 0) + 1);

  return rows.map((v) => enrichVaga(v, cargoNome.get(v.cargoId ?? -1) ?? "", totalPorVaga.get(v.id) ?? 0));
}

export async function getVagaPorId(id: number): Promise<VagaDTO | null> {
  const db = getDb();
  const rows = await db.select().from(vagas).where(eq(vagas.id, id)).limit(1);
  const v = rows[0];
  if (!v) return null;
  const cargoNome = v.cargoId
    ? (await db.select({ nome: cargos.nome }).from(cargos).where(eq(cargos.id, v.cargoId)).limit(1))[0]?.nome ?? ""
    : "";
  const total = (await db.select().from(candidaturas).where(eq(candidaturas.vagaId, id))).length;
  return enrichVaga(v, cargoNome, total);
}

export async function getVagaPorToken(token: string): Promise<Vaga | null> {
  const rows = await getDb().select().from(vagas).where(eq(vagas.token, token)).limit(1);
  return rows[0] ?? null;
}

function enrichVaga(v: Vaga, cargoNome: string, total: number): VagaDTO {
  return {
    id: v.id,
    nome: v.nome,
    descricao: v.descricao,
    cargoId: v.cargoId,
    cargoNome,
    departamento: v.departamento,
    modelo: v.modelo as VagaModelo,
    cidade: v.cidade,
    status: v.status as VagaStatus,
    presetId: v.presetId,
    token: v.token,
    totalCandidaturas: total,
    criadoEmLabel: dtBR(v.criadoEm),
  };
}

// ── Candidaturas ──────────────────────────────────────────────────────────
export async function getCandidaturas(filtroVagaId?: number): Promise<CandidaturaDTO[]> {
  const db = getDb();
  const rows = filtroVagaId
    ? await db.select().from(candidaturas).where(eq(candidaturas.vagaId, filtroVagaId)).orderBy(desc(candidaturas.criadoEm))
    : await db.select().from(candidaturas).orderBy(desc(candidaturas.criadoEm));
  if (rows.length === 0) return [];

  const vagaIds = [...new Set(rows.map((c) => c.vagaId))];
  const vagaRows = await db.select().from(vagas).where(inArray(vagas.id, vagaIds));
  const vagaPorId = new Map(vagaRows.map((v) => [v.id, v]));

  const presetIds = [...new Set(vagaRows.map((v) => v.presetId).filter((id): id is number => id != null))];
  const presetRows = presetIds.length
    ? await db.select().from(presets).where(inArray(presets.id, presetIds))
    : [];
  const camposPorPreset = new Map(presetRows.map((p) => [p.id, p.campos as FieldDef[]]));

  const respostaRows = await db
    .select()
    .from(candidaturaRespostas)
    .where(inArray(candidaturaRespostas.candidaturaId, rows.map((c) => c.id)));
  const respostaPorCandidatura = new Map(respostaRows.map((r) => [r.candidaturaId, r.valores as RespostaValores]));

  return rows.map((c) => {
    const vaga = vagaPorId.get(c.vagaId);
    const campos = vaga?.presetId ? camposPorPreset.get(vaga.presetId) ?? [] : [];
    const valores = respostaPorCandidatura.get(c.id) ?? {};
    return enrichCandidatura(c, vaga?.nome ?? "—", campos, valores);
  });
}

export async function getCandidaturaCompleta(id: number): Promise<{
  candidatura: CandidaturaDTO;
  campos: FieldDef[];
  valores: RespostaValores;
} | null> {
  const db = getDb();
  const rows = await db.select().from(candidaturas).where(eq(candidaturas.id, id)).limit(1);
  const c = rows[0];
  if (!c) return null;

  const vagaRows = await db.select().from(vagas).where(eq(vagas.id, c.vagaId)).limit(1);
  const vaga = vagaRows[0];
  const campos = vaga?.presetId
    ? ((await db.select().from(presets).where(eq(presets.id, vaga.presetId)).limit(1))[0]?.campos as FieldDef[] | undefined) ?? []
    : [];
  const respostaRows = await db
    .select()
    .from(candidaturaRespostas)
    .where(eq(candidaturaRespostas.candidaturaId, id))
    .limit(1);
  const valores = (respostaRows[0]?.valores as RespostaValores | undefined) ?? {};

  return {
    candidatura: enrichCandidatura(c, vaga?.nome ?? "—", campos, valores),
    campos,
    valores,
  };
}

function enrichCandidatura(
  c: Candidatura,
  vagaNome: string,
  campos: FieldDef[],
  valores: RespostaValores,
): CandidaturaDTO {
  return {
    id: c.id,
    vagaId: c.vagaId,
    vagaNome,
    nome: c.nome,
    email: c.email,
    telefone: c.telefone,
    status: c.status as CandidaturaStatus,
    usuarioId: c.usuarioId,
    criadoEmLabel: dtBR(c.criadoEm),
    criadoEmMs: c.criadoEm.getTime(),
    cidade: porLabel(campos, valores, "cidade"),
    experiencia: porLabel(campos, valores, "experiênc", "experienc"),
    foto: porLabel(campos, valores, "foto", "avatar"),
  };
}
