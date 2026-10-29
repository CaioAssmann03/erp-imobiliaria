import type { Metadata } from "next";

import { CondominiumBackLink } from "../../_components/CondominiumBackLink";
import { CostCenterForm } from "../../_components/CostCenterForm";
import { CostCenterHeader } from "../../_components/CostCenterHeader";
import { CostCenterSideMenu } from "../../_components/CostCenterSideMenu";
import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Editar sub-conta" };

export default async function EditCostCenterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <FormPage aside={<CostCenterSideMenu costCenterId={id} />}>
      <PageHeader backSlot={<CondominiumBackLink costCenterId={id} />} title={<CostCenterHeader costCenterId={id} />} />
      <CostCenterForm costCenterId={id} />
    </FormPage>
  );
}
