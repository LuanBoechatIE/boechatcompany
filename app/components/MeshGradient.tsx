"use client";

import { MeshGradient as PaperMeshGradient } from "@paper-design/shaders-react";

const INK = ["#171221", "#2e1065", "#6d28d9", "#a78bfa"];

export function MeshGradientBg({
  colors = INK,
  speed = 0.35,
  distortion = 0.85,
  swirl = 0.55,
  className,
}: {
  colors?: string[];
  speed?: number;
  distortion?: number;
  swirl?: number;
  className?: string;
}) {
  return (
    <PaperMeshGradient
      colors={colors}
      speed={speed}
      distortion={distortion}
      swirl={swirl}
      grainMixer={0.25}
      grainOverlay={0.15}
      scale={1.1}
      style={{ width: "100%", height: "100%" }}
      className={className}
    />
  );
}
