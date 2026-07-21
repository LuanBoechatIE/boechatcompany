import { AdminShell } from "@/app/components/admin/AdminShell";
import { logout } from "./actions";

export const metadata = {
  title: "Admin · Boechat",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell logoutAction={logout}>{children}</AdminShell>;
}
