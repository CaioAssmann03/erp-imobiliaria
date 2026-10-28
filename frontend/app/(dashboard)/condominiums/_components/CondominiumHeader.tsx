"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useCondominiumsRetrieve } from "@/lib/api/generated";
import { StatusBadge } from "@/components/StatusBadge";

import { CondominiumDeleteButton } from "./CondominiumDeleteButton";

/** Client Component: o nome, o código e a situação do condomínio aberto, com Excluir; usa a mesma consulta do formulário (uma só chamada). */
export function CondominiumHeader({ condominiumId }: { condominiumId: string }) {
  const { data: condominium } = useCondominiumsRetrieve(condominiumId);

  if (!condominium) return <Skeleton className="mb-6 h-9 w-72 rounded-control" />;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <h1 className="text-title">{condominium.name}</h1>
      <span className="rounded-md bg-surface-muted px-2 py-0.5 text-caption font-medium tabular-nums text-ink-soft">
        {String(condominium.code).padStart(4, "0")}
      </span>
      <StatusBadge active={condominium.active ?? true} />
      <div className="ml-auto">
        <CondominiumDeleteButton condominiumId={condominium.id} name={condominium.name} />
      </div>
    </div>
  );
}
