import type { Metadata } from "next";

import { CostCenterForm } from "../../_components/CostCenterForm";
import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Editar sub-conta" };

export default async function EditCostCenterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <FormPage>
      <PageHeader back={{ href: "/condominiums/cost-centers", label: "Sub-contas" }} title="Editar sub-conta" />
      <CostCenterForm costCenterId={id} />
    </FormPage>
  );
}
