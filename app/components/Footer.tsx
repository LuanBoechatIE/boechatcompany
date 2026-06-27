import { Wordmark } from "./Wordmark";

export function Footer() {
  return (
    <footer className="border-t border-ink-line/60 py-14">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Wordmark className="text-3xl" />
            <p className="mt-4 max-w-xs text-gelo-dim">
              Faço o digital do seu negócio vender de verdade.
            </p>
          </div>

          <div className="flex flex-col gap-3 text-gelo-dim sm:items-end">
            <a href="/trabalhos" className="transition-colors hover:text-gelo">
              Trabalhos
            </a>
            <a
              href="https://instagram.com"
              className="transition-colors hover:text-gelo"
            >
              Instagram
            </a>
            <a
              href="https://wa.me/0000000000"
              className="transition-colors hover:text-gelo"
            >
              WhatsApp
            </a>
            <a
              href="mailto:contato@boechat.company"
              className="transition-colors hover:text-gelo"
            >
              contato@boechat.company
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
