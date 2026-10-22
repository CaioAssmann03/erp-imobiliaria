import { ArrowLeft } from "lucide-react";

import { LinkButton } from "@/components/LinkButton";

/** No celular a lista é uma página própria: o condomínio aberto ganha este "voltar" (a partir de 1024 px a lista já está ao lado). */
export function BackToList() {
  return (
    <LinkButton
      href="/condominiums"
      variant="ghost"
      size="sm"
      aria-label="Voltar para Condomínios"
      className="-ml-2.5 gap-1.5 px-2.5 text-ink-soft hover:text-ink lg:hidden"
    >
      <ArrowLeft aria-hidden className="size-4" />
      Condomínios
    </LinkButton>
  );
}
