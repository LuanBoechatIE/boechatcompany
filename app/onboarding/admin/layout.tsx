import Link from "next/link";
import { logout } from "./actions";

export const metadata = {
  title: "Onboarding · Boechat",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10">
      <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-baseline gap-6">
          <Link href="/onboarding/admin" className="font-display text-xl uppercase">
            Boechat<span className="text-roxo">.</span>{" "}
            <span className="text-sm font-normal text-gelo-dim">onboarding</span>
          </Link>
          <nav className="flex gap-5 text-sm">
            <Link href="/onboarding/admin" className="text-gelo-dim hover:text-gelo">
              Onboardings
            </Link>
            <Link
              href="/onboarding/admin/presets"
              className="text-gelo-dim hover:text-gelo"
            >
              Presets
            </Link>
          </nav>
        </div>
        <form action={logout}>
          <button className="text-sm text-gelo-dim hover:text-gelo">Sair</button>
        </form>
      </header>
      {children}
    </div>
  );
}
