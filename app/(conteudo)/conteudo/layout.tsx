import Link from "next/link";

// Shell do módulo de Conteúdo. Independente do /admin de propósito: compartilha
// auth (middleware), banco e Blob, mas tem navegação e visual próprios.
export const metadata = {
  title: "Conteúdo · Boechat",
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/conteudo", rotulo: "Hoje" },
  { href: "/conteudo/produtos", rotulo: "Produtos" },
];

export default function ConteudoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-ink text-gelo">
      <header className="sticky top-0 z-30 border-b border-ink-line/70 bg-ink/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-8 px-6">
          <Link
            href="/conteudo"
            className="text-sm font-semibold tracking-tight text-gelo"
          >
            Conteúdo
          </Link>
          <nav className="flex items-center gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-1.5 text-sm text-gelo-dim transition-colors hover:bg-ink-soft hover:text-gelo"
              >
                {item.rotulo}
              </Link>
            ))}
          </nav>
          <Link
            href="/admin"
            className="ml-auto text-sm text-gelo-dim transition-colors hover:text-gelo"
          >
            Voltar ao admin
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
