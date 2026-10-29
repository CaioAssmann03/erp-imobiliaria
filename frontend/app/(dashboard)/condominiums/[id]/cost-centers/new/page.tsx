import type { Metadata } from "next";

import { CostCenterForm } from "../../../_components/CostCenterForm";
import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Nova sub-conta" };

export default async function NewCondominiumCostCenterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listUrl = `/condominiums/${id}/cost-centers`;

  return (
    <FormPage>
      <PageHeader back={{ href: listUrl, label: "Sub-contas" }} title="Nova sub-conta" />
      <CostCenterForm condominiumId={id} returnUrl={listUrl} />
    </FormPage>
  );
}
