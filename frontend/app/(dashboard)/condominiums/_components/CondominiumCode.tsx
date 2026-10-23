"use client";

import { useCondominiumsRetrieve } from "@/lib/api/generated";

/** O ID do condomínio no cabeçalho da página; usa a mesma consulta do formulário (uma só chamada). */
export function CondominiumCode({ condominiumId }: { condominiumId: string }) {
  const { data: condominium } = useCondominiumsRetrieve(condominiumId);
  return condominium ? `ID ${condominium.code}` : null;
}
