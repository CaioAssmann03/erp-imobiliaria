import type { Metadata } from "next";

import { CostCenterForm } from "@/app/(dashboard)/condominiums/_components/cost-centers/CostCenterForm";
import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = { title: "Nova sub-conta" };

export default function NewCostCenterPage() {
  return (
    <FormPage>
      <PageHeader back={{ href: "/condominiums", label: "Condomínios" }} title="Nova sub-conta" />
      <CostCenterForm />
    </FormPage>
  );
}
