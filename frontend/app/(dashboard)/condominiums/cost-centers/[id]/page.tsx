import type { Metadata } from "next";

import { CondominiumBackLink } from "@/app/(dashboard)/condominiums/_components/condominium/CondominiumBackLink";
import { CostCenterForm } from "@/app/(dashboard)/condominiums/_components/cost-centers/CostCenterForm";
import { CostCenterHeader } from "@/app/(dashboard)/condominiums/_components/cost-centers/CostCenterHeader";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = { title: "Editar sub-conta" };

export default async function EditCostCenterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <PageHeader backSlot={<CondominiumBackLink costCenterId={id} />} title={<CostCenterHeader costCenterId={id} />} />
      <CostCenterForm costCenterId={id} />
    </>
  );
}
