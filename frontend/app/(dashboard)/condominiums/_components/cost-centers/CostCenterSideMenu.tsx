"use client";

import { SectionIndex } from "@/components/layout/SectionIndex";
import { useCostCentersRetrieve } from "@/lib/api/generated";
import { costCenterUrl } from "@/lib/condominiums/cost-center-workspace";

/**
 * O menu da direita da edição de uma sub-conta: só os dados dela. Não há "Cadastros" aqui: nada é cadastrado dentro de uma sub-conta (contas
 * a pagar e lançamentos só a referenciam e ficam no Financeiro); o caminho de volta é a seta acima do título. Enquanto a sub-conta carrega,
 * só reserva o espaço.
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
        ],
      }}
    />
  );
}
