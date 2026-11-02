"use client";

import { CondominiumBackLink } from "@/app/(dashboard)/condominiums/_components/condominium/CondominiumBackLink";
import { RegistryHeader } from "@/components/layout/RegistryHeader";
import { useCostCentersRetrieve } from "@/lib/api/generated";

/**
 * Client Component: o título da edição de uma sub-conta: o "voltar" ao condomínio dela (ou à tela de origem), o código (cinza, como na lista ao
 * lado), o nome e a situação em texto simples (verde ativo, preto inativo). Usa a mesma consulta do formulário (uma só chamada).
 */
export function CostCenterHeader({ costCenterId }: { costCenterId: string }) {
  const { data: costCenter } = useCostCentersRetrieve(costCenterId);

  return (
    <RegistryHeader
      back={<CondominiumBackLink costCenterId={costCenterId} />}
      record={costCenter && { code: costCenter.code, name: costCenter.name, active: costCenter.active ?? true }}
    />
  );
}
