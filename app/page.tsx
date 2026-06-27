import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { Manifesto } from "./components/Manifesto";
import { Tese } from "./components/Tese";
import { Method } from "./components/Method";
import { Proof } from "./components/Proof";
import { CTA } from "./components/CTA";
import { Footer } from "./components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <Hero />
        <Manifesto />
        <Tese />
        <Method />
        <Proof />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
