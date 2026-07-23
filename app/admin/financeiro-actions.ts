"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, and, ne } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import { contratos, pagamentos, despesas } from "@/app/lib/db/schema";
import { exigirPermissao } from "@/app/lib/perms-guard";

function num(v: FormDataEntryValue | null): string {
  const n = Number(String(v ?? "").replace(",", "."));
  return (isNaN(n) ? 0 : n).toFixed(2);
}

function parseDate(v: FormDataEntryValue | null): Date {
  const s = String(v ?? "").trim();
  const d = s ? new Date(s) : new Date();
  return isNaN(d.getTime()) ? new Date() : d;
}

function addMonths(d: Date, n: number) {
  const out = new Date(d);
  out.setMonth(out.getMonth() + n);
  return out;
}

// ── Contratos ────────────────────────────────────────────────────────────────

export async function createContrato(formData: FormData) {
  await exigirPermissao("financeiro.editar");
  const clienteId = Number(formData.get("clienteId"));
  const servico = String(formData.get("servico") ?? "").trim();
  if (!clienteId || !servico) return;

  const valorImplementacao = num(formData.get("valorImplementacao"));
  const valorRecorrente = num(formData.get("valorRecorrente"));
  const dataInicio = parseDate(formData.get("dataInicio"));
  const projetoIdRaw = Number(formData.get("projetoId"));

  const db = getDb();
  const [novo] = await db
    .insert(contratos)
    .values({
      clienteId,
      projetoId: projetoIdRaw > 0 ? projetoIdRaw : null,
      servico,
      valorImplementacao,
      valorRecorrente,
      status: "ativo",
      dataInicio,
      proximaCobranca: Number(valorRecorrente) > 0 ? addMonths(dataInicio, 1) : null,
    })
    .returning({ id: contratos.id });

  if (Number(valorImplementacao) > 0) {
    await db.insert(pagamentos).values({
      contratoId: novo.id,
      clienteId,
      tipo: "implementacao",
      valor: valorImplementacao,
      status: "pendente",
      vencimento: addMonths(dataInicio, 0),
    });
  }

  revalidatePath(`/admin/crm/clientes/${clienteId}`);
  revalidatePath("/admin/crm");
  revalidatePath("/admin/crm/financeiro");
}

export async function updateContratoStatus(formData: FormData) {
  await exigirPermissao("financeiro.editar");
  const id = Number(formData.get("id"));
  const clienteId = Number(formData.get("clienteId"));
  const status = String(formData.get("status") ?? "");
  if (!id || !status) return;
  await getDb().update(contratos).set({ status }).where(eq(contratos.id, id));
  revalidatePath(`/admin/crm/clientes/${clienteId}`);
  revalidatePath("/admin/crm");
}

export async function deleteContrato(formData: FormData) {
  await exigirPermissao("financeiro.editar");
  const id = Number(formData.get("id"));
  const clienteId = Number(formData.get("clienteId"));
  if (!id) return;
  await getDb().delete(contratos).where(eq(contratos.id, id));
  revalidatePath(`/admin/crm/clientes/${clienteId}`);
  revalidatePath("/admin/crm");
}

// ── Pagamentos ───────────────────────────────────────────────────────────────

export async function createPagamento(formData: FormData) {
  await exigirPermissao("financeiro.editar");
  const contratoId = Number(formData.get("contratoId"));
  const clienteId = Number(formData.get("clienteId"));
  const tipo = String(formData.get("tipo") ?? "implementacao");
  const valor = num(formData.get("valor"));
  const vencimento = parseDate(formData.get("vencimento"));
  if (!contratoId || !clienteId || Number(valor) <= 0) return;

  await getDb().insert(pagamentos).values({
    contratoId,
    clienteId,
    tipo,
    valor,
    status: "pendente",
    vencimento,
  });
  revalidatePath(`/admin/crm/clientes/${clienteId}`);
  revalidatePath("/admin/crm");
  revalidatePath("/admin/crm/financeiro");
}

export async function markPagamentoPago(formData: FormData) {
  await exigirPermissao("financeiro.editar");
  const id = Number(formData.get("id"));
  const clienteId = Number(formData.get("clienteId"));
  if (!id) return;
  await getDb()
    .update(pagamentos)
    .set({ status: "pago", pagoEm: new Date() })
    .where(eq(pagamentos.id, id));
  revalidatePath(`/admin/crm/clientes/${clienteId}`);
  revalidatePath("/admin/crm");
  revalidatePath("/admin/crm/financeiro");
}

export async function deletePagamento(formData: FormData) {
  await exigirPermissao("financeiro.editar");
  const id = Number(formData.get("id"));
  const clienteId = Number(formData.get("clienteId"));
  if (!id) return;
  await getDb().delete(pagamentos).where(eq(pagamentos.id, id));
  revalidatePath(`/admin/crm/clientes/${clienteId}`);
  revalidatePath("/admin/crm");
  revalidatePath("/admin/crm/financeiro");
}

// Varre contratos ativos com recorrência vencida, gera o pagamento do ciclo e
// empurra a próxima cobrança pra frente. Idempotente: só gera se a próxima
// cobrança já chegou, e sempre avança a data, então rodar de novo não duplica.
export async function gerarCobrancasDoMes() {
  await exigirPermissao("financeiro.editar");
  const db = getDb();
  const hoje = new Date();
  const ativos = await db
    .select()
    .from(contratos)
    .where(and(eq(contratos.status, "ativo"), ne(contratos.valorRecorrente, "0.00")));

  let geradas = 0;
  for (const c of ativos) {
    if (!c.proximaCobranca || c.proximaCobranca > hoje) continue;
    await db.insert(pagamentos).values({
      contratoId: c.id,
      clienteId: c.clienteId,
      tipo: "recorrente",
      valor: c.valorRecorrente,
      status: "pendente",
      vencimento: c.proximaCobranca,
    });
    await db
      .update(contratos)
      .set({ proximaCobranca: addMonths(c.proximaCobranca, 1) })
      .where(eq(contratos.id, c.id));
    geradas++;
  }

  revalidatePath("/admin/crm");
  revalidatePath("/admin/crm/financeiro");
  redirect(`/admin/crm/financeiro?geradas=${geradas}`);
}

// ── Despesas ─────────────────────────────────────────────────────────────────

export async function createDespesa(formData: FormData) {
  await exigirPermissao("financeiro.editar");
  const descricao = String(formData.get("descricao") ?? "").trim();
  const valor = num(formData.get("valor"));
  if (!descricao || Number(valor) <= 0) return;

  await getDb()
    .insert(despesas)
    .values({
      descricao,
      valor,
      categoria: String(formData.get("categoria") ?? "geral").trim() || "geral",
      data: parseDate(formData.get("data")),
      recorrente: formData.get("recorrente") === "on",
    });
  revalidatePath("/admin/crm/financeiro");
  revalidatePath("/admin/crm");
}

export async function deleteDespesa(formData: FormData) {
  await exigirPermissao("financeiro.editar");
  const id = Number(formData.get("id"));
  if (!id) return;
  await getDb().delete(despesas).where(eq(despesas.id, id));
  revalidatePath("/admin/crm/financeiro");
  revalidatePath("/admin/crm");
}

