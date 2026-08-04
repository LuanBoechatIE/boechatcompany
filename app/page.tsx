import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { Tese } from "./components/Tese";
import { Servicos } from "./components/Servicos";
import { Entrega } from "./components/Entrega";
import { Resultados } from "./components/Resultados";
import { CTA } from "./components/CTA";
import { Footer } from "./components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <Hero />
        <Tese />
        <Servicos />
        <Entrega />
        <Resultados />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
