import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Área interna",
  robots: { index: false, follow: false },
};

export default function ContratosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-ink text-gelo">{children}</div>;
}
