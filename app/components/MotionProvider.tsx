"use client";

import { LazyMotion, MotionConfig, domMax } from "framer-motion";
import type { ReactNode } from "react";

// `reducedMotion="user"`: quem liga "reduzir movimento" no sistema recebe só a
// transição de opacidade, sem deslocamento. O bloco @media do globals.css não
// cobre isso — ele zera animação e transition do CSS, e o framer-motion anima
// por JS, fora do alcance dele.
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domMax}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
