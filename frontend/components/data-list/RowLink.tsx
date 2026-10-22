import Link from "next/link";

/** Nome da linha: link que cobre a linha inteira (clicar em qualquer ponto abre o registro). */
export function RowLink({
  href,
  children,
  sub,
  compact = false,
  subAlways = false,
}: {
  href: string;
  children: React.ReactNode;
  /** Linha de apoio, só no celular (onde as outras colunas ficam escondidas). */
  sub?: React.ReactNode;
  /** Nome mais estreito no celular, para linhas com mais de uma ação visível. */
  compact?: boolean;
  /** A linha de apoio aparece em qualquer largura (a tabela não tem colunas para o que ela diz). */
  subAlways?: boolean;
}) {
  const mobileWidth = compact ? "max-w-[8.5rem]" : "max-w-[13rem]";
  // Com mais de uma ação por linha o nome também encolhe nas larguras médias, para a tabela caber sem rolagem lateral.
  const wideWidth = compact ? "sm:max-w-[16rem] lg:max-w-[22rem]" : "sm:max-w-[22rem]";
  return (
    <div className="min-w-0">
      <Link
        href={href}
        className={`block ${mobileWidth} truncate font-medium after:absolute after:inset-0 ${wideWidth}`}
      >
        {children}
      </Link>
      {sub && (
        <div className={`${mobileWidth} truncate text-caption text-ink-soft ${wideWidth} ${subAlways ? "" : "md:hidden"}`}>
          {sub}
        </div>
      )}
    </div>
  );
}
