import Link from "next/link";
import type { CargoView } from "../../../roles-actions";

const inputCls =
  "w-full rounded-xl border border-ink-line bg-ink p-3 text-base outline-none focus:border-roxo-light/60";
const labelCls = "text-sm text-gelo-dim";

export function VagaForm({
  action,
  cargos,
  formularios,
  initial,
}: {
  action: (formData: FormData) => void | Promise<void>;
  cargos: CargoView[];
  formularios: { id: number; nome: string }[];
  initial?: {
    id: number;
    nome: string;
    descricao: string;
    cargoId: number | null;
    departamento: string;
    modelo: string;
    cidade: string;
    status: string;
    presetId: number | null;
  };
}) {
  return (
    <form action={action} className="flex max-w-2xl flex-col gap-5">
      {initial && <input type="hidden" name="id" value={initial.id} />}

      <label className="flex flex-col gap-2">
        <span className={labelCls}>Nome da vaga</span>
        <input
          name="nome"
          required
          defaultValue={initial?.nome}
          className={inputCls}
          placeholder="Ex.: Atendente Comercial"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className={labelCls}>Descrição</span>
        <textarea
          name="descricao"
          rows={4}
          defaultValue={initial?.descricao}
          className={inputCls}
          placeholder="O que a pessoa vai fazer, requisitos, benefícios..."
        />
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className={labelCls}>Cargo</span>
          <select name="cargoId" defaultValue={initial?.cargoId ?? ""} className={inputCls}>
            <option value="">—</option>
            {cargos.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
          {cargos.length === 0 && (
            <span className="text-xs text-gelo-dim/70">
              Nenhum cargo cadastrado ainda —{" "}
              <Link href="/admin/configuracoes" className="text-roxo-light underline">crie um em Configurações</Link>.
            </span>
          )}
        </label>

        <label className="flex flex-col gap-2">
          <span className={labelCls}>Departamento</span>
          <input name="departamento" defaultValue={initial?.departamento} className={inputCls} placeholder="Ex.: Comercial" />
        </label>

        <label className="flex flex-col gap-2">
          <span className={labelCls}>Modelo</span>
          <select name="modelo" defaultValue={initial?.modelo ?? "presencial"} className={inputCls}>
            <option value="presencial">Presencial</option>
            <option value="hibrido">Híbrido</option>
            <option value="remoto">Remoto</option>
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className={labelCls}>Cidade</span>
          <input name="cidade" defaultValue={initial?.cidade} className={inputCls} placeholder="Ex.: São Paulo, SP" />
        </label>

        <label className="flex flex-col gap-2">
          <span className={labelCls}>Status</span>
          <select name="status" defaultValue={initial?.status ?? "rascunho"} className={inputCls}>
            <option value="rascunho">Rascunho</option>
            <option value="aberta">Aberta</option>
            <option value="fechada">Fechada</option>
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className={labelCls}>Formulário de candidatura</span>
          <select name="presetId" defaultValue={initial?.presetId ?? ""} className={inputCls}>
            <option value="">Só nome/email/telefone (sem campos extra)</option>
            {formularios.map((f) => (
              <option key={f.id} value={f.id}>{f.nome}</option>
            ))}
          </select>
          {formularios.length === 0 && (
            <span className="text-xs text-gelo-dim/70">
              Nenhum formulário ainda —{" "}
              <Link href="/admin/equipe/recrutamento/formularios/novo" className="text-roxo-light underline">crie um</Link>{" "}
              pra pedir currículo, experiência etc.
            </span>
          )}
        </label>
      </div>

      <div className="flex items-center gap-4 pt-2">
        <button className="rounded-full bg-roxo px-6 py-3 text-sm font-medium text-white">
          {initial ? "Salvar vaga" : "Criar vaga"}
        </button>
        <Link href="/admin/equipe/recrutamento/vagas" className="text-sm text-gelo-dim hover:text-gelo">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
