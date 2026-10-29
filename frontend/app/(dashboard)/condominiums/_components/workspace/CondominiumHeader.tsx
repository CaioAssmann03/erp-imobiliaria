"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useCondominiumsRetrieve } from "@/lib/api/generated";
import { throwIfNotFound } from "@/lib/query/not-found";

/** Client Component: o nome do condomínio aberto. Usa a mesma consulta do formulário. */
export function CondominiumHeader({ condominiumId }: { condominiumId: string }) {
  const { data: condominium, error } = useCondominiumsRetrieve(condominiumId);
  throwIfNotFound(error);

  if (!condominium) return <Skeleton className="h-8 w-72" />;

  return (
    <h2 className="truncate text-title">
      {condominium.name}
      {!condominium.active && <span className="text-ink-soft"> · Inativo</span>}
    </h2>
  );
}
