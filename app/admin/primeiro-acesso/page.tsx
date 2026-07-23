import { KeyRound } from "lucide-react";
import { PrimeiroAcessoForm } from "./PrimeiroAcessoForm";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default function PrimeiroAcessoPage() {
  return (
    <div className="max-w-md">
      <div className="mb-6 flex items-center gap-3">
        <KeyRound className="h-6 w-6 text-roxo-light" />
        <h1 className="font-display text-2xl uppercase text-gelo">Troca de senha obrigatória</h1>
      </div>
      <p className="mb-6 text-sm text-gelo-dim">
        Esta é a primeira vez que você acessa a plataforma. Por segurança,
        defina uma senha nova antes de continuar.
      </p>
      <PrimeiroAcessoForm />
    </div>
  );
}
