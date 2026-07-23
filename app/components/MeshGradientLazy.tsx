"use client";

import dynamic from "next/dynamic";

// O shader (@paper-design/shaders-react) só existe no cliente (WebGL/canvas),
// então isso nunca some do SSR: só tira o parse/exec do caminho síncrono de hidratação.
export const MeshGradientBg = dynamic(
  () => import("./MeshGradient").then((m) => m.MeshGradientBg),
  { ssr: false },
);
