import { AdminShell } from "../components/admin/AdminShell";
import { logout } from "../admin/actions";
import { getPerfilAtual } from "../admin/perfil-actions";
import { ContratosForm } from "./ContratosForm";

export default async function ContratosPage() {
  const perfil = await getPerfilAtual();
  return (
    <AdminShell logoutAction={logout} perfil={perfil}>
      <ContratosForm />
    </AdminShell>
  );
}
