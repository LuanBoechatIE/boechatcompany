"use client";

// Seletor global "Todos / vendedor específico" — só aparece pra quem tem
// visão de equipe (Diretor Comercial/Dono). Controla o ESCOPO de dados
// carregados pela página (não é um filtro de refino, é a permissão em ação).
import { useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Users2 } from "lucide-react";
import type { UsuarioBasico } from "../../crm-actions";

export function VendedorFiltro({
  usuarios,
  atual,
}: {
  usuarios: UsuarioBasico[];
  atual: string; // "" = todos, ou usuarios.id como string
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  function onChange(v: string) {
    const params = new URLSearchParams(window.location.search);
    if (v) params.set("vendedor", v);
    else params.delete("vendedor");
    const qs = params.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname));
  }

  return (
    <label className="flex items-center gap-2 rounded-xl border border-ink-line bg-ink px-3 py-2 text-sm">
      <Users2 className="h-4 w-4 text-gelo-dim" />
      <select
        value={atual}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-gelo outline-none"
      >
        <option value="">Todos os vendedores</option>
        {usuarios.map((u) => (
          <option key={u.id} value={u.id}>{u.nome}</option>
        ))}
      </select>
    </label>
  );
}
