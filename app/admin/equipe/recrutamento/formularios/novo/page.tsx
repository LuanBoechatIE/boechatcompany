import { temPermissao } from "@/app/lib/perms-guard";
import { SemPermissao } from "../../../../crm/SemPermissao";
import { PresetEditor } from "../../../../presets/PresetEditor";
import { createFormularioVaga } from "../../../../recrutamento-actions";

export const dynamic = "force-dynamic";

export default async function NovoFormularioVaga() {
  if (!(await temPermissao("recrutamento.visualizar"))) return <SemPermissao area="Formulários" />;

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 font-display text-3xl uppercase">Novo formulário de vaga</h1>
      <PresetEditor
        action={createFormularioVaga}
        rotuloNome="Nome do formulário"
        rotuloCampos="Campos da candidatura"
        voltarHref="/admin/equipe/recrutamento/formularios"
      />
    </div>
  );
}
