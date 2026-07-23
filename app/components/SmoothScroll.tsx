"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function SmoothScroll() {
  const pathname = usePathname();
  // Admin/contratos são dashboards com paineis, modais e sidebars de scroll
  // aninhado — o Lenis sequestra o wheel globalmente e rola sempre a página
  // inteira, ignorando qual elemento está sob o mouse. Smooth scroll é uma
  // escolha estética do site institucional, não faz sentido em telas de app.
  const desabilitado = pathname.startsWith("/admin") || pathname.startsWith("/contratos");

  useEffect(() => {
    if (desabilitado) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    let raf = 0;
    let lenis: import("lenis").default | null = null;
    let cancelled = false;

    // Import assíncrono: tira o peso do Lenis do bundle síncrono inicial,
    // sem atrasar perceptivelmente o início do smooth scroll.
    import("lenis").then(({ default: Lenis }) => {
      if (cancelled) return;
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 1.4,
      });

      const tick = (time: number) => {
        lenis?.raf(time);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      lenis?.destroy();
    };
  }, [desabilitado]);

  return null;
}
