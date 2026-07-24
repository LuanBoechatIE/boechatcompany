import { AdminShell } from "../components/admin/AdminShell";
import { logout } from "../admin/actions";
import { getPerfilAtual } from "../admin/perfil-actions";
import { temPermissao } from "../lib/perms-guard";
import { SemPermissao } from "../admin/crm/SemPermissao";
import { ContratosForm } from "./ContratosForm";

export default async function ContratosPage() {
  const perfil = await getPerfilAtual();
  const pode = await temPermissao("contratos.visualizar");
  return (
    <AdminShell logoutAction={logout} perfil={perfil}>
      {pode ? <ContratosForm /> : <SemPermissao area="Contratos" />}
    </AdminShell>
  );
}
