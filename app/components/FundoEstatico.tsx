/**
 * Substituto do shader de fundo quando `FLAGS.shaderBackground` está desligado.
 *
 * São radial-gradients de CSS puro: sem canvas, sem WebGL, sem loop de
 * animação por frame, e sem baixar o chunk do `@paper-design/shaders-react`.
 * Mantém a mesma leitura visual (profundidade roxa saindo do escuro) por um
 * custo de renderização que não aparece em nenhum profiler.
 *
 * Não é client component de propósito: é markup estático, então renderiza no
 * servidor e não custa nada na hidratação.
 */
export function FundoEstatico({
  variante = "hero",
}: {
  variante?: "hero" | "cta";
}) {
  const camadas =
    variante === "hero"
      ? [
          "radial-gradient(60% 55% at 18% 28%, rgba(109,40,217,0.42) 0%, transparent 62%)",
          "radial-gradient(45% 40% at 78% 18%, rgba(167,139,250,0.20) 0%, transparent 58%)",
          "radial-gradient(70% 60% at 62% 82%, rgba(46,16,101,0.55) 0%, transparent 68%)",
        ]
      : [
          "radial-gradient(55% 50% at 50% 30%, rgba(109,40,217,0.38) 0%, transparent 62%)",
          "radial-gradient(65% 55% at 20% 75%, rgba(76,29,149,0.42) 0%, transparent 65%)",
          "radial-gradient(50% 45% at 82% 70%, rgba(46,16,101,0.50) 0%, transparent 60%)",
        ];

  return (
    <div
      aria-hidden
      className="h-full w-full"
      style={{ backgroundImage: camadas.join(", ") }}
    />
  );
}
