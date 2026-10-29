"use client";

import { SectionIndex } from "@/components/SectionIndex";
import { useCostCentersRetrieve } from "@/lib/api/generated";
import { condominiumPageUrl, condominiumUrl } from "@/lib/condominium-registry";
import { costCenterUrl } from "@/lib/cost-center-workspace";

/**
 * O menu da direita da edição de uma sub-conta: os dados dela e o caminho de volta às sub-contas e ao condomínio. O condomínio vem da
 * própria sub-conta (a mesma consulta do formulário); enquanto carrega, só reserva o espaço.
 */
export function CostCenterSideMenu({ costCenterId }: { costCenterId: string }) {
  const { data: costCenter } = useCostCentersRetrieve(costCenterId);
  if (!costCenter) return <div aria-hidden className="hidden w-48 shrink-0 xl:block 2xl:w-56" />;

  return (
    <SectionIndex
      sections={[]}
      label="Menu da sub-conta"
      links={{
        title: "Nesta sub-conta",
        items: [
          { href: costCenterUrl(costCenter.id), label: "Dados da sub-conta", current: true },
          { href: condominiumPageUrl(costCenter.condominium, "cost-centers"), label: "Sub-contas do condomínio" },
          { href: condominiumUrl(costCenter.condominium), label: "Dados do condomínio" },
        ],
      }}
    />
  );
}
