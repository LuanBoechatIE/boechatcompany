"use client";

import { m, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";

export function CountUp({
  to,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 1.8,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  // `margin: "-80px"` exigia o número ficar 80px pra dentro da tela pra
  // disparar — no celular, com a barra de endereço mudando de altura durante
  // a rolagem, o viewport reportado ao IntersectionObserver oscila e a
  // contagem podia nunca disparar, travando em 0. `amount` mede fração visível
  // do próprio elemento em vez de distância da borda: não depende da altura
  // do viewport, então não quebra com o chrome do navegador indo e vindo.
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) =>
    `${prefix}${v.toLocaleString("pt-BR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}${suffix}`,
  );

  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, to, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [inView, mv, to, duration]);

  return (
    <span ref={ref} className="inline-block whitespace-nowrap tabular-nums">
      <m.span>{rounded}</m.span>
    </span>
  );
}
