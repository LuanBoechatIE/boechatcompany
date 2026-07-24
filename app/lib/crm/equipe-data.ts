// Dados da página "Performance da Equipe" (Diretor Comercial/Dono). Reaproveita
// enrichLead/computeMetrics de leads-data.ts pra nunca calcular a mesma coisa
// de dois jeitos diferentes — cada vendedor é só um "escopo" de computeMetrics.
import { and, eq, inArray, isNull } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import { leads, leadAtividades, usuarios, userCargos, cargos } from "@/app/lib/db/schema";
import { enrichLead, computeMetrics, atividadeToDTO, type LeadsMetrics } from "./leads-data";
import type { LeadDTO, AtividadeDTO } from "./types";

export type VendedorRanking = {
  usuarioId: number;
  nome: string;
  foto: string;
  status: string;
  cargos: string[];
  metrics: LeadsMetrics;
  leadsRecentes: LeadDTO[];
  atividadesRecentes: AtividadeDTO[];
};

export type EquipeData = {
  vendedores: VendedorRanking[];
  todos: LeadDTO[]; // todos os leads (não arquivados), qualquer dono — pro pipeline geral
};

export async function getEquipeData(): Promise<EquipeData> {
  const db = getDb();
  const now = Date.now();

  const [usuariosRows, leadsRows, ativsRows] = await Promise.all([
    db
      .select()
      .from(usuarios)
      .where(and(eq(usuarios.status, "ativo"), isNull(usuarios.deletedAt))),
    db.select().from(leads).where(eq(leads.arquivado, false)),
    db.select().from(leadAtividades),
  ]);

  const ativsPorLead = new Map<number, typeof ativsRows>();
  for (const a of ativsRows) {
    const arr = ativsPorLead.get(a.leadId) ?? [];
    arr.push(a);
    ativsPorLead.set(a.leadId, arr);
  }

  const todos = leadsRows.map((l) => enrichLead(l, ativsPorLead.get(l.id) ?? [], now));

  // Cargos de todo mundo numa query só (evita N+1).
  const cargosPorUsuario = new Map<number, string[]>();
  if (usuariosRows.length > 0) {
    const cargoRows = await db
      .select({ usuarioId: userCargos.usuarioId, nome: cargos.nome })
      .from(userCargos)
      .innerJoin(cargos, eq(userCargos.cargoId, cargos.id))
      .where(inArray(userCargos.usuarioId, usuariosRows.map((u) => u.id)));
    for (const r of cargoRows) {
      const arr = cargosPorUsuario.get(r.usuarioId) ?? [];
      arr.push(r.nome);
      cargosPorUsuario.set(r.usuarioId, arr);
    }
  }

  const vendedores: VendedorRanking[] = usuariosRows.map((u) => {
    const meusLeads = todos.filter((l) => l.usuarioId === u.id);
    // Atividade (ligações, reuniões marcadas...) conta por quem EXECUTOU
    // (leadAtividades.usuarioId), não por quem é dono do lead. Um lead sem
    // dono definido (usuarioId null, comum em leads antigos não migrados)
    // não pode fazer a reunião marcada nele desaparecer da métrica de quem
    // realmente marcou.
    const minhasAtivs = ativsRows.filter((a) => a.usuarioId === u.id);
    const leadsRecentes = [...meusLeads]
      .sort((a, b) => (b.atualizadoEmMs ?? b.criadoEmMs) - (a.atualizadoEmMs ?? a.criadoEmMs))
      .slice(0, 8);
    const atividadesRecentes = [...minhasAtivs]
      .sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime())
      .slice(0, 10)
      .map(atividadeToDTO);
    return {
      usuarioId: u.id,
      nome: u.nomeCompleto || u.username,
      foto: u.foto,
      status: u.status,
      cargos: cargosPorUsuario.get(u.id) ?? [],
      metrics: computeMetrics(meusLeads, minhasAtivs, now),
      leadsRecentes,
      atividadesRecentes,
    };
  });

  return { vendedores, todos };
}
