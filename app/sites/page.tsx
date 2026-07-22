import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Nav } from "../components/Nav";
import { Footer } from "../components/Footer";
import { SitesHero } from "../components/SitesHero";
import { Work } from "../components/Work";
import { SitesKPIs } from "../components/SitesKPIs";
import { Performance } from "../components/Performance";
import { SitesOferta } from "../components/SitesOferta";
import { Reveal } from "../components/Reveal";
import { Magnetic } from "../components/Magnetic";
import { MeshGradientBg } from "../components/MeshGradient";
import { whatsappLink } from "../lib/contato";

const WA_SITE = whatsappLink(
  "Oi, Boechat. Vi seu portfólio de sites e quero o meu.",
);

export const metadata: Metadata = {
  title: "Portfólio. Sites — Boechat",
  description:
    "Sites com identidade própria, Lighthouse no teto e copy feita pra vender. Cada um pensado pra UM trabalho: transformar visita em cliente.",
  openGraph: {
    title: "Sites que vendem — Boechat",
    description:
      "Site não é cartão de visita. É vendedor 24h. Identidade própria, performance no teto e copy que converte.",
    url: "https://boechat.company/sites",
    siteName: "Boechat Company",
    locale: "pt_BR",
    type: "website",
    images: [{ url: "/icon.png", width: 512, height: 512, alt: "Boechat Company" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sites que vendem — Boechat",
    description:
      "Site não é cartão de visita. É vendedor 24h. Identidade própria, performance no teto e copy que converte.",
    images: ["/icon.png"],
  },
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
        <SitesOferta />

        <section className="relative overflow-hidden border-t border-ink-line/60 py-32 sm:py-48">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-80"
          >
            <MeshGradientBg
              colors={["#171221", "#2e1065", "#4c1d95", "#6d28d9"]}
              speed={0.18}
              distortion={1}
              swirl={0.75}
            />
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--color-ink)_70%)]"
          />

          <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
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
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
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
