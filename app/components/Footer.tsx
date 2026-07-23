import Link from "next/link";
import { Wordmark } from "./Wordmark";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL, WA_AGENDAR } from "../lib/contato";

export function Footer() {
  return (
    <footer className="border-t border-ink-line/60 py-14">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Wordmark className="text-3xl" />
            <p className="mt-4 max-w-xs text-gelo-dim">
              Vender mais sem gastar mais em anúncio.
            </p>
          </div>

          <div className="flex flex-col gap-3 text-gelo-dim sm:items-end">
            <Link
              href="/#resultados"
              className="transition-colors hover:text-gelo"
            >
              Resultados
            </Link>
            <Link href="/sites" className="transition-colors hover:text-gelo">
              Portfólio. Sites
            </Link>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-gelo"
            >
              @{INSTAGRAM_HANDLE}
            </a>
            <a
              href={WA_AGENDAR}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-gelo"
            >
              WhatsApp
            </a>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-ink-line/60 pt-6 text-sm text-gelo-dim sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} Boechat Company.</span>
          <span>Resultado no digital. Sem enrolação.</span>
        </div>
      </div>
    </footer>
  );
}
