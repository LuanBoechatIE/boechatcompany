"use client";

// Botão de submit que pede confirmação antes de deixar o form (geralmente uma
// server action destrutiva) seguir. Fica no formulário no lugar do <button>.
export function ConfirmSubmitButton({
  confirmMsg,
  className,
  children,
  ariaLabel,
}: {
  confirmMsg: string;
  className?: string;
  children: React.ReactNode;
  ariaLabel?: string;
}) {
  return (
    <button
      type="submit"
      aria-label={ariaLabel}
      className={className}
      onClick={(e) => {
        if (!window.confirm(confirmMsg)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
