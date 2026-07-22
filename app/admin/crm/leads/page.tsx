import { desc, eq } from "drizzle-orm";
import { Search } from "lucide-react";
import { dbConfigured, getDb } from "@/app/lib/db";
import { leads, leadAtividades } from "@/app/lib/db/schema";
import { CrmSetupNotice } from "../CrmSetupNotice";
import { LeadsBoard } from "./LeadsBoard";
import { LeadsToolbar } from "./LeadsToolbar";
import {
  LEAD_STAGES,
  ORIGENS_LEAD,
  SERVICOS,
  RESPONSAVEIS,
  type LeadDTO,
  type AtividadeDTO,
  type LeadStatus,
} from "@/app/lib/crm/types";

export const dynamic = "force-dynamic";

const inputCls =
  "rounded-xl border border-ink-line bg-ink px-3 py-2 text-sm text-gelo-dim outline-none focus:border-roxo-light/50";

const dtBR = (d: Date) =>
  d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
const dtCurto = (d: Date) =>
  d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
const iso = (d: Date) => d.toISOString().slice(0, 10);

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  if (!dbConfigured()) return <CrmSetupNotice />;

  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase();
  const fResp = sp.responsavel ?? "";
  const fOrigem = sp.origem ?? "";
  const fServico = sp.servico ?? "";
  const fStatus = sp.status ?? "";

  let rows: (typeof leads.$inferSelect)[] = [];
  let ativs: (typeof leadAtividades.$inferSelect)[] = [];
  let erro = false;
  try {
    const db = getDb();
    rows = await db
      .select()
      .from(leads)
      .where(eq(leads.arquivado, false))
      .orderBy(desc(leads.criadoEm));
    ativs = await db
      .select()
      .from(leadAtividades)
      .orderBy(desc(leadAtividades.criadoEm));
  } catch {
    erro = true;
  }
  if (erro) return <CrmSetupNotice />;

  const agora = Date.now();

  const filtradas = rows.filter((l) => {
    if (fResp && l.responsavel !== fResp) return false;
    if (fOrigem && l.origem !== fOrigem) return false;
    if (fServico && l.servico !== fServico) return false;
    if (fStatus && l.status !== fStatus) return false;
    if (q) {
      const hay = [l.nome, l.empresa, l.pessoaContato, l.email, l.telefone, l.whatsapp]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const dtos: LeadDTO[] = filtradas.map((l) => {
    const prox = l.proximoContato ? new Date(l.proximoContato) : null;
    const atrasado =
      !!prox &&
      prox.getTime() < agora &&
      l.status !== "convertido" &&
      l.status !== "perdido";
    return {
      id: l.id,
      nome: l.nome,
      empresa: l.empresa,
      pessoaContato: l.pessoaContato,
      telefone: l.telefone,
      email: l.email,
      whatsapp: l.whatsapp,
      servico: l.servico,
      responsavel: l.responsavel,
      origem: l.origem,
      valorEstimado: l.valorEstimado,
      proximaAcao: l.proximaAcao,
      tags: l.tags,
      observacoes: l.observacoes,
      status: l.status as LeadStatus,
      motivoPerda: l.motivoPerda,
      criadoEmLabel: dtBR(new Date(l.criadoEm)),
      proximoContatoLabel: prox ? dtCurto(prox) : null,
      proximoContatoInput: prox ? iso(prox) : "",
      atrasado,
    };
  });

  const atividadesPorLead: Record<number, AtividadeDTO[]> = {};
  for (const a of ativs) {
    const dto: AtividadeDTO = {
      id: a.id,
      tipo: a.tipo,
      texto: a.texto,
      dataLabel: a.data ? dtBR(new Date(a.data)) : null,
      feito: a.feito,
      autor: a.autor,
      criadoEmLabel: dtBR(new Date(a.criadoEm)),
    };
    (atividadesPorLead[a.leadId] ??= []).push(dto);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase">Leads</h1>
          <p className="mt-1 text-sm text-gelo-dim">
            Pipeline comercial. Arrasta os cards entre as etapas.
          </p>
        </div>
        <LeadsToolbar leads={dtos} />
      </div>

      {/* Busca e filtros */}
      <form method="get" className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[12rem]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gelo-dim" />
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Buscar por nome, empresa, contato, e-mail..."
            className={`${inputCls} w-full pl-9`}
          />
        </div>
        <select name="responsavel" defaultValue={fResp} className={inputCls}>
          <option value="">Responsável</option>
          {RESPONSAVEIS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <select name="origem" defaultValue={fOrigem} className={inputCls}>
          <option value="">Origem</option>
          {ORIGENS_LEAD.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <select name="servico" defaultValue={fServico} className={inputCls}>
          <option value="">Serviço</option>
          {SERVICOS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select name="status" defaultValue={fStatus} className={inputCls}>
          <option value="">Etapa</option>
          {LEAD_STAGES.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
        <button className="rounded-xl bg-roxo px-4 py-2 text-sm font-medium text-white">
          Filtrar
        </button>
        {(q || fResp || fOrigem || fServico || fStatus) && (
          <a href="/admin/crm/leads" className="text-sm text-gelo-dim hover:text-gelo">
            Limpar
          </a>
        )}
      </form>

      <LeadsBoard leads={dtos} atividadesPorLead={atividadesPorLead} />
    </div>
  );
}
