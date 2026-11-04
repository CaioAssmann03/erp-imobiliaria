import Link from "next/link";

/** O aviso vermelho de um card que leva à lista do que está atrasado: o mesmo vermelho de `Late`, sublinhado ao passar o mouse ou com o foco. */
export function LateLink({ href, title, children }: { href: string; title: string; children: React.ReactNode }) {
  return (
    <Link href={href} title={title} className="text-danger underline-offset-2 transition-colors hover:underline focus-visible:underline focus-visible:outline-none">
      {children}
    </Link>
  );
}
