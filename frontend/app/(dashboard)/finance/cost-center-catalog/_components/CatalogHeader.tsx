"use client";

import { BackLink } from "@/components/layout/BackLink";
import { StatusText } from "@/components/StatusText";
import { Skeleton } from "@/components/ui/skeleton";
import { useCostCenterCatalogRetrieve } from "@/lib/api/generated";
import { formatCode } from "@/lib/billing/billing-entry-payload";
import { catalogUrl } from "@/lib/finance/cost-center-catalog-workspace";

/**
 * Client Component: o código (cinza, como na lista ao lado), o nome e a situação da sub-conta aberta, a situação em texto simples. Usa a mesma
 * consulta do formulário (uma só chamada); o Excluir fica na barra de ações dele. No celular, onde a lista não fica ao lado, tem o "voltar" à lista no alto.
 */
export function CatalogHeader({ itemId }: { itemId: string }) {
  const { data: item } = useCostCenterCatalogRetrieve(itemId);

  const back = (
    <div className="lg:hidden">
      <BackLink href={catalogUrl()} label="Sub-contas" />
    </div>
  );

  if (!item)
    return (
      <>
        {back}
        <Skeleton className="mb-6 h-9 w-72 rounded-control" />
      </>
    );

  return (
    <>
      {back}
      <div className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-title">
          <span className="tabular-nums text-ink-faint">{formatCode(item.code ?? 0)}</span>
          <span className="text-ink-faint"> · </span>
          {item.name}
        </h1>
        <StatusText active={item.active ?? true} />
      </div>
    </>
  );
}
