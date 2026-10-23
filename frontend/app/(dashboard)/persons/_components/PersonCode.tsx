"use client";

import { usePersonsRetrieve } from "@/lib/api/generated";

/** O ID da pessoa no cabeçalho da página; usa a mesma consulta do formulário (uma só chamada). */
export function PersonCode({ personId }: { personId: string }) {
  const { data: person } = usePersonsRetrieve(personId);
  return person ? `ID ${person.code}` : null;
}
