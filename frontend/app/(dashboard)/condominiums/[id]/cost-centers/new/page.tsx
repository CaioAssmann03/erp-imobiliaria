import type { Metadata } from "next";

import { CostCenterForm } from "../../../_components/CostCenterForm";
import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";
import { condominiumUrl } from "@/lib/condominium-registry";

export const metadata: Metadata = { title: "Nova sub-conta" };

export default async function NewCondominiumCostCenterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <FormPage>
      <PageHeader back={{ href: condominiumUrl(id, "sub-contas"), label: "Condomínio" }} title="Nova sub-conta" />
      <CostCenterForm condominiumId={id} />
    </FormPage>
  );
}
