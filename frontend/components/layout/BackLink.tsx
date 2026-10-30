import { ArrowLeft } from "lucide-react";

import { LinkButton } from "@/components/LinkButton";

/** O "voltar" no alto de uma tela: seta e o nome do destino. */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <LinkButton
      href={href}
      variant="ghost"
      size="sm"
      aria-label={`Voltar para ${label}`}
      className="group -ml-2.5 mb-2 gap-1.5 px-2.5 text-ink-soft hover:text-ink"
    >
      <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
      {label}
    </LinkButton>
  );
}
