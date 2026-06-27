export function Wordmark({
  className = "",
  dotClass = "text-roxo-light",
}: {
  className?: string;
  dotClass?: string;
}) {
  return (
    <span className={`font-display leading-none ${className}`}>
      BOECHAT<span className={dotClass}>.</span>
    </span>
  );
}
