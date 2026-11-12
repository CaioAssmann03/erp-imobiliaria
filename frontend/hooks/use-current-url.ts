"use client";

import { usePathname, useSearchParams } from "next/navigation";

/** O endereço da tela aberta com a busca (`/caminho?a=1`): o que um link para uma tela mais funda leva em `?from=` para o "voltar" voltar para cá. */
export function useCurrentUrl(): string {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  return search ? `${pathname}?${search}` : pathname;
}
