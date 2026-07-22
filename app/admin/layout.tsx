import { AdminShell } from "@/app/components/admin/AdminShell";
import { logout } from "./actions";
import { getPerfilAtual } from "./perfil-actions";

export const metadata = {
  title: "Admin · Boechat",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let perfil = null;
  try {
    perfil = await getPerfilAtual();
  } catch {
    // Sem banco/perfil, a sidebar apenas não mostra o bloco.
  }
  return (
    <AdminShell logoutAction={logout} perfil={perfil}>
      {children}
    </AdminShell>
  );
}
