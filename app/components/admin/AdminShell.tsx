"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ComponentType, type ReactNode } from "react";
import {
  FileSignature,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Menu,
  X,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  match: (pathname: string) => boolean;
};

const NAV: NavItem[] = [
  {
    href: "/admin",
    label: "Painel",
    icon: LayoutDashboard,
    match: (p) => p === "/admin" || p.startsWith("/admin/clientes"),
  },
  {
    href: "/admin/presets",
    label: "Presets",
    icon: LayoutTemplate,
    match: (p) => p.startsWith("/admin/presets"),
  },
  {
    href: "/contratos",
    label: "Contratos",
    icon: FileSignature,
    match: (p) => p.startsWith("/contratos") && p !== "/contratos/login",
  },
];

export function AdminShell({
  children,
  logoutAction,
}: {
  children: ReactNode;
  logoutAction: () => void | Promise<void>;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-ink text-gelo">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-ink-line bg-ink-soft/40 px-4 py-6 lg:flex">
        <SidebarContent pathname={pathname} logoutAction={logoutAction} />
      </aside>

      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-ink-line bg-ink/95 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/admin" className="font-display text-lg uppercase">
          Boechat<span className="text-roxo">.</span>
        </Link>
        <button
          onClick={() => setMobileOpen((o) => !o)}
          className="rounded-lg border border-ink-line p-2 text-gelo-dim hover:border-roxo-light/50 hover:text-gelo"
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-ink-line bg-ink px-4 py-6 pt-20 shadow-2xl">
            <SidebarContent
              pathname={pathname}
              logoutAction={logoutAction}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      <main className="min-w-0 flex-1 px-6 py-10 pt-24 lg:pt-10">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
}

function SidebarContent({
  pathname,
  logoutAction,
  onNavigate,
}: {
  pathname: string;
  logoutAction: () => void | Promise<void>;
  onNavigate?: () => void;
}) {
  return (
    <>
      <Link
        href="/admin"
        className="mb-8 flex items-baseline gap-2 font-display text-xl uppercase"
      >
        Boechat<span className="text-roxo">.</span>{" "}
        <span className="text-xs font-normal normal-case text-gelo-dim">admin</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "border-roxo/40 bg-roxo/10 font-medium text-gelo"
                  : "border-transparent text-gelo-dim hover:border-ink-line hover:bg-ink-soft/60 hover:text-gelo"
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${active ? "text-roxo-light" : ""}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <form action={logoutAction} className="pt-6">
        <button className="flex w-full items-center gap-3 rounded-xl border border-ink-line px-3 py-2.5 text-sm text-gelo-dim transition-colors hover:border-red-500/30 hover:text-red-300">
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </form>
    </>
  );
}
