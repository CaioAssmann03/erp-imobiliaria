import Link from "next/link";

/** Nome da linha: link que cobre a linha inteira (clicar em qualquer ponto abre o registro). */
export function RowLink({
  href,
  children,
  sub,
  compact = false,
}: {
  href: string;
  children: React.ReactNode;
  /** Linha de apoio, só no celular (onde as outras colunas ficam escondidas). */
  sub?: React.ReactNode;
  /** Nome mais estreito no celular, para linhas com mais de uma ação visível. */
  compact?: boolean;
}) {
  const mobileWidth = compact ? "max-w-[8.5rem]" : "max-w-[13rem]";
  return (
    <div className="min-w-0">
      <Link
        href={href}
        className={`block ${mobileWidth} truncate font-medium after:absolute after:inset-0 sm:max-w-[22rem]`}
      >
        {children}
      </Link>
      {sub && (
        <div className={`${mobileWidth} truncate text-caption text-ink-soft md:hidden`}>{sub}</div>
      )}
    </div>
  );
}
