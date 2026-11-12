"use client";

import { RecordDeleteButton } from "@/components/RecordDeleteButton";
import { getCostCenterCatalogListQueryKey, useCostCenterCatalogDestroy } from "@/lib/api/generated";
import { catalogUrl } from "@/lib/finance/cost-center-catalog-workspace";

/** Client Component: exclui a sub-conta aberta (confirmação) e volta à tela do catálogo, sem nenhuma aberta. Uma que condomínios usam não sai: o backend recusa e a mensagem vem no aviso (desative em vez de excluir). */
export function CatalogDeleteButton({ itemId, name }: { itemId: string; name: string }) {
  const destroyMutation = useCostCenterCatalogDestroy();

  return (
    <RecordDeleteButton
      title="Excluir sub-conta do catálogo?"
      description={`A sub-conta "${name}" será excluída do catálogo. Se algum condomínio a usa, o sistema recusa: desative-a.`}
      destroy={(options) => destroyMutation.mutate({ id: itemId }, options)}
      invalidate={[getCostCenterCatalogListQueryKey()]}
      success="Sub-conta excluída."
      redirectTo={catalogUrl()}
    />
  );
}
