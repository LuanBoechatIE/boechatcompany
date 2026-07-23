import Link from "next/link";
import { Settings, Ban, ShieldCheck } from "lucide-react";
import { dbConfigured } from "@/app/lib/db";
import { listUsuariosAdmin } from "../../../usuarios-actions";
import { SetupNotice } from "../../../SetupNotice";

export const dynamic = "force-dynamic";

export default async function FuncionariosPage() {
  if (!dbConfigured()) return <SetupNotice />;

  let usuarios: Awaited<ReturnType<typeof listUsuariosAdmin>> = [];
  let semAcesso = false;
  try {
    usuarios = await listUsuariosAdmin();
  } catch {
    semAcesso = true;
  }

  if (semAcesso) {
    return (
      <div className="rounded-2xl border border-ink-line bg-ink-soft/30 p-8 text-center text-sm text-gelo-dim">
        Esta lista é restrita a superadministradores.
      </div>
    );
  }

  const ativos = usuarios.filter((u) => !u.excluido);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase">Funcionários</h1>
          <p className="mt-1 text-sm text-gelo-dim">
            Quem já foi contratado e tem acesso à plataforma. Edição, bloqueio e
            redefinição de senha ficam em{" "}
            <Link href="/admin/configuracoes" className="text-roxo-light underline">
              Configurações
            </Link>
            .
          </p>
        </div>
      </div>

      {ativos.length === 0 ? (
        <div className="rounded-2xl border border-ink-line bg-ink-soft/30 p-8 text-center text-sm text-gelo-dim">
          Nenhum funcionário ainda. Contrate alguém em{" "}
          <Link href="/admin/equipe/recrutamento/candidatos" className="text-roxo-light underline">
            Candidatos
          </Link>
          .
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ativos.map((u) => (
            <div key={u.id} className="flex flex-col gap-3 rounded-2xl border border-ink-line bg-ink-soft/30 p-5">
              <div className="flex items-start gap-3">
                {u.foto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.foto} alt="" className="h-12 w-12 shrink-0 rounded-full border border-ink-line object-cover" />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-ink-line bg-ink text-sm font-medium text-gelo-dim">
                    {u.nome.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-medium text-gelo">{u.nome}</h3>
                  <p className="truncate text-xs text-gelo-dim">@{u.username}{u.email ? ` · ${u.email}` : ""}</p>
                </div>
                {u.status === "bloqueado" ? (
                  <span className="flex shrink-0 items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[11px] font-medium text-red-300">
                    <Ban className="h-3 w-3" /> Bloqueado
                  </span>
                ) : u.superAdmin ? (
                  <span className="flex shrink-0 items-center gap-1 rounded-full border border-roxo/30 bg-roxo/10 px-2.5 py-1 text-[11px] font-medium text-roxo-light">
                    <ShieldCheck className="h-3 w-3" /> Admin
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                    Ativo
                  </span>
                )}
              </div>

              {u.cargos.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {u.cargos.map((c) => (
                    <span
                      key={c.id}
                      className="rounded-full border px-2 py-0.5 text-[11px]"
                      style={{ borderColor: `${c.cor}55`, color: c.cor, backgroundColor: `${c.cor}15` }}
                    >
                      {c.nome}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-auto flex items-center justify-between border-t border-ink-line pt-3 text-xs text-gelo-dim">
                <span>Desde {u.criadoEmLabel}</span>
                <Link
                  href="/admin/configuracoes"
                  className="flex items-center gap-1 text-gelo-dim hover:text-gelo"
                >
                  <Settings className="h-3.5 w-3.5" /> Gerenciar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
