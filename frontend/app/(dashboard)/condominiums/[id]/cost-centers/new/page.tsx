import type { Metadata } from "next";

import { CostCenterForm } from "../../../_components/CostCenterForm";
import { CondominiumSideMenu } from "../../../_components/CondominiumSideMenu";
import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";
import { condominiumUrl } from "@/lib/condominium-registry";

export const metadata: Metadata = { title: "Nova sub-conta" };

export default async function NewCondominiumCostCenterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <FormPage aside={<CondominiumSideMenu condominiumId={id} current="cost-centers" />}>
      <PageHeader back={{ href: condominiumUrl(id), label: "Condomínio" }} title="Nova sub-conta" />
      <CostCenterForm condominiumId={id} />
    </FormPage>
  );
}
