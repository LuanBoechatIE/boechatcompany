import type { Metadata } from "next";
import { Nav } from "../components/Nav";
import { Footer } from "../components/Footer";
import { SitesHero } from "../components/SitesHero";
import { Work } from "../components/Work";
import { SitesKPIs } from "../components/SitesKPIs";
import { Performance } from "../components/Performance";
import { Reveal } from "../components/Reveal";
import { Magnetic } from "../components/Magnetic";
import { whatsappLink } from "../lib/contato";

const WA_SITE = whatsappLink(
  "Oi, Boechat. Vi seu portfólio de sites e quero o meu.",
);

export const metadata: Metadata = {
  title: "Portfólio. Sites — Boechat",
  description:
    "Sites com identidade própria, Lighthouse no teto e copy feita pra vender. Cada um pensado pra UM trabalho: transformar visita em cliente.",
};

export default function Sites() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <SitesHero />
        <Work />
        <SitesKPIs />
        <Performance />
        <section className="border-t border-ink-line/60 py-28 sm:py-40">
          <div className="mx-auto max-w-5xl px-6 text-center">
            <Reveal>
              <span className="text-sm font-medium uppercase tracking-[0.2em] text-roxo-light">
                Sua vez
              </span>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="mt-6 font-display text-[clamp(2.4rem,7vw,5.5rem)] uppercase leading-[0.95] text-balance">
                Bonito vende a vista
                <span className="text-roxo">.</span>
                <br />
                <span className="text-roxo-light">Estrutura vende cliente</span>
                <span className="text-roxo">.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mx-auto mt-8 max-w-xl text-lg leading-relaxed text-gelo-dim">
                Manda seu negócio. Eu te mostro como ficaria o site dele, sem
                compromisso.
              </p>
            </Reveal>
            <Reveal delay={0.18}>
              <div className="mt-10 flex justify-center">
                <Magnetic className="inline-block">
                  <a
                    href={WA_SITE}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 rounded-full bg-roxo px-8 py-4 text-base font-medium text-white shadow-[0_8px_40px_-12px_rgba(109,40,217,0.6)] transition-shadow duration-300 hover:shadow-[0_12px_60px_-12px_rgba(109,40,217,0.85)]"
                  >
                    Quero o meu site
                    <span className="transition-transform duration-200 group-hover:translate-x-1">
                      →
                    </span>
                  </a>
                </Magnetic>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
