"use client";

import { StatusText } from "@/components/StatusText";
import { Skeleton } from "@/components/ui/skeleton";
import { useCostCentersRetrieve } from "@/lib/api/generated";
import { formatCode } from "@/lib/billing/billing-entry-payload";

/**
 * Client Component: o título da edição de uma sub-conta: o código (cinza, como na lista ao lado), o nome e a situação em texto simples
 * (verde ativo, preto inativo), como no cabeçalho do condomínio. Usa a mesma consulta do formulário (uma só chamada).
 */
export function CostCenterHeader({ costCenterId }: { costCenterId: string }) {
  const { data: costCenter } = useCostCentersRetrieve(costCenterId);

  if (!costCenter) return <Skeleton className="h-9 w-72 rounded-control" />;

  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span>
        <span className="tabular-nums text-ink-faint">{formatCode(costCenter.code)}</span>
        <span className="text-ink-faint"> · </span>
        {costCenter.name}
      </span>
      <StatusText active={costCenter.active ?? true} />
    </span>
  );
}
