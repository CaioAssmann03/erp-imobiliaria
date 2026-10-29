import type { Metadata } from "next";

import { CostCenterForm } from "../../../_components/CostCenterForm";
import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Editar sub-conta" };

export default async function EditCondominiumCostCenterPage({
  params,
}: {
  params: Promise<{ id: string; costCenterId: string }>;
}) {
  const { id, costCenterId } = await params;
  const listUrl = `/condominiums/${id}/cost-centers`;

  return (
    <FormPage>
      <PageHeader back={{ href: listUrl, label: "Sub-contas" }} title="Editar sub-conta" />
      <CostCenterForm costCenterId={costCenterId} condominiumId={id} returnUrl={listUrl} />
    </FormPage>
  );
}
