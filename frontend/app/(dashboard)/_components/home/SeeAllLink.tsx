import Link from "next/link";

/**
 * Link "Ver todos" dos cards: cinza, só aparece quando o card (`group/card`) recebe
 * hover ou focus. Em telas sem hover (touch) fica sempre visível.
 */
export function SeeAllLink({
  href,
  children = "Ver todos",
}: {
  href: string;
  children?: React.ReactNode;
}) {
  return (
    <Link href={href} className="text-body text-ink-soft opacity-0 transition-opacity group-focus-within/card:opacity-100 group-hover/card:opacity-100 hover:text-ink focus-visible:opacity-100 [@media(hover:none)]:opacity-100">
      {children}
    </Link>
  );
}
