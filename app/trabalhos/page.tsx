import type { Metadata } from "next";
import { Nav } from "../components/Nav";
import { Work } from "../components/Work";
import { Footer } from "../components/Footer";

export const metadata: Metadata = {
  title: "Trabalhos — Boechat",
  description:
    "Alguns dos negócios que ganharam uma presença feita pra vender. Cada um com identidade própria.",
};

export default function Trabalhos() {
  return (
    <>
      <Nav />
      <main className="flex-1 pt-16">
        <Work />
      </main>
      <Footer />
    </>
  );
}
