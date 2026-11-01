"use client";

import { PhoneBackLink } from "@/components/layout/BackLink";
import { RegistryHeader } from "@/components/layout/RegistryHeader";
import { useCostCenterCatalogRetrieve } from "@/lib/api/generated";
import { catalogUrl } from "@/lib/finance/cost-center-catalog-workspace";

/**
 * Client Component: o código (cinza, como na lista ao lado), o nome e a situação da sub-conta aberta, a situação em texto simples. Usa a mesma
 * consulta do formulário (uma só chamada); o Excluir fica na barra de ações dele. No celular, onde a lista não fica ao lado, tem o "voltar" à lista no alto.
 */
export function CatalogHeader({ itemId }: { itemId: string }) {
  const { data: item } = useCostCenterCatalogRetrieve(itemId);

  return (
    <RegistryHeader
      back={<PhoneBackLink href={catalogUrl()} label="Sub-contas" />}
      record={item && { code: item.code, name: item.name, active: item.active ?? true }}
    />
  );
}
