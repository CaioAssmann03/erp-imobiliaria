import type { Metadata } from "next";

import { CostCenterForm } from "@/app/(dashboard)/condominiums/_components/cost-centers/CostCenterForm";
import { CostCenterHeader } from "@/app/(dashboard)/condominiums/_components/cost-centers/CostCenterHeader";

export const metadata: Metadata = { title: "Editar sub-conta" };

export default async function EditCostCenterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <CostCenterHeader costCenterId={id} />
      <CostCenterForm costCenterId={id} />
    </>
  );
}
