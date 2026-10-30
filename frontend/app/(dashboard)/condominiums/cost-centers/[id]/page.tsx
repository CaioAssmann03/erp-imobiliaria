import type { Metadata } from "next";

import { CondominiumBackLink } from "../../_components/CondominiumBackLink";
import { CostCenterForm } from "../../_components/CostCenterForm";
import { CostCenterHeader } from "../../_components/CostCenterHeader";
import { PageHeader } from "@/components/PageHeader";

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
