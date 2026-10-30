"use client";

import { BackLink } from "@/components/layout/BackLink";
import { Skeleton } from "@/components/ui/skeleton";
import { useCondominiumsRetrieve } from "@/lib/api/generated";
import { statementUrl } from "@/lib/finance/statement-workspace";

/**
 * Client Component: o código (cinza, como na lista ao lado) e o nome do condomínio do extrato aberto. No celular, onde a lista não fica ao lado,
 * tem o "voltar" à lista no alto.
 */
export function StatementHeader({ condominiumId }: { condominiumId: string }) {
  const { data: condominium } = useCondominiumsRetrieve(condominiumId);

  const back = (
    <div className="lg:hidden">
      <BackLink href={statementUrl()} label="Extrato" />
    </div>
  );

  if (!condominium)
    return (
      <>
        {back}
        <Skeleton className="mb-6 h-9 w-72 rounded-control" />
      </>
    );

  return (
    <>
      {back}
      <h1 className="mb-6 text-title">
        <span className="tabular-nums text-ink-faint">{String(condominium.code).padStart(4, "0")}</span>
        <span className="text-ink-faint"> · </span>
        {condominium.name}
      </h1>
    </>
  );
}
