"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ComponentType, type ReactNode } from "react";
import {
  CalendarDays,
  FileSignature,
  Inbox,
  LayoutDashboard,
  LayoutTemplate,
  ListTodo,
  LogOut,
  Menu,
  Network,
  Target,
  UsersRound,
  KanbanSquare,
  ClipboardList,
  X,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  match: (pathname: string) => boolean;
};

type NavGroup = {
  titulo: string;
  itens: NavItem[];
};

const exact = (href: string) => (p: string) => p === href;
const prefix = (href: string) => (p: string) => p.startsWith(href);

const NAV_GROUPS: NavGroup[] = [
  {
    titulo: "Gestão",
    itens: [
      { href: "/admin/crm", label: "Dashboard", icon: LayoutDashboard, match: exact("/admin/crm") },
      { href: "/admin/crm/leads", label: "Leads", icon: Inbox, match: prefix("/admin/crm/leads") },
      { href: "/admin/crm/clientes", label: "Clientes", icon: UsersRound, match: prefix("/admin/crm/clientes") },
      { href: "/admin/crm/projetos", label: "Projetos", icon: KanbanSquare, match: prefix("/admin/crm/projetos") },
      { href: "/admin/crm/demandas", label: "Demandas", icon: ListTodo, match: prefix("/admin/crm/demandas") },
      { href: "/admin/crm/estrategia", label: "Estratégia", icon: Target, match: prefix("/admin/crm/estrategia") },
      { href: "/admin/crm/calendario", label: "Calendário", icon: CalendarDays, match: prefix("/admin/crm/calendario") },
      { href: "/admin/crm/mapas", label: "Mapas mentais", icon: Network, match: prefix("/admin/crm/mapas") },
    ],
  },
  {
    titulo: "Onboarding",
    itens: [
      { href: "/admin", label: "Onboardings", icon: ClipboardList, match: (p) => p === "/admin" || p.startsWith("/admin/clientes") },
      { href: "/admin/presets", label: "Presets", icon: LayoutTemplate, match: prefix("/admin/presets") },
    ],
  },
  {
    titulo: "Comercial",
    itens: [
      { href: "/contratos", label: "Contratos", icon: FileSignature, match: (p) => p.startsWith("/contratos") && p !== "/contratos/login" },
    ],
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

      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto">
        {NAV_GROUPS.map((grupo) => (
          <div key={grupo.titulo} className="flex flex-col gap-1">
            <span className="px-3 pb-1 text-[10px] font-medium uppercase tracking-wider text-gelo-dim/60">
              {grupo.titulo}
            </span>
            {grupo.itens.map((item) => {
              const active = item.match(pathname);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-sm transition-colors ${
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
          </div>
        ))}
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
