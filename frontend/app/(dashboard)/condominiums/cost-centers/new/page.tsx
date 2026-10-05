import type { Metadata } from "next";

import { CostCenterForm } from "../../_components/CostCenterForm";
import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Nova sub-conta" };

export default function NewCostCenterPage() {
  return (
    <FormPage>
      <PageHeader back={{ href: "/condominiums/cost-centers", label: "Sub-contas" }} title="Nova sub-conta" />
      <CostCenterForm />
    </FormPage>
  );
}
