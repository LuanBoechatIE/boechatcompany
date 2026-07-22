import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import type { Node, Edge } from "@xyflow/react";
import { getDb } from "@/app/lib/db";
import { mapasMentais } from "@/app/lib/db/schema";
import { MapaEditor } from "./MapaEditor";
import { renameMapa } from "../../../crm-actions";

export const dynamic = "force-dynamic";

export default async function MapaDetalhe({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const mapaId = Number(id);
  if (!mapaId) notFound();

  const rows = await getDb()
    .select()
    .from(mapasMentais)
    .where(eq(mapasMentais.id, mapaId))
    .limit(1);
  const mapa = rows[0];
  if (!mapa) notFound();

  const nodes = (Array.isArray(mapa.nodes) ? mapa.nodes : []) as Node[];
  const edges = (Array.isArray(mapa.edges) ? mapa.edges : []) as Edge[];

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/admin/crm/mapas"
        className="flex w-fit items-center gap-1.5 text-sm text-gelo-dim hover:text-gelo"
      >
        <ArrowLeft className="h-4 w-4" />
        Mapas mentais
      </Link>

      <form action={renameMapa} className="flex items-center gap-2">
        <input type="hidden" name="id" value={mapa.id} />
        <input
          name="titulo"
          defaultValue={mapa.titulo}
          className="w-full max-w-md rounded-xl border border-transparent bg-transparent font-display text-3xl uppercase text-gelo outline-none hover:border-ink-line focus:border-roxo-light/50 focus:bg-ink"
        />
        <button className="rounded-lg border border-ink-line bg-ink px-3 py-1.5 text-xs text-gelo-dim hover:border-roxo-light/50 hover:text-gelo">
          Renomear
        </button>
      </form>

      <MapaEditor id={mapa.id} initialNodes={nodes} initialEdges={edges} />
    </div>
  );
}
