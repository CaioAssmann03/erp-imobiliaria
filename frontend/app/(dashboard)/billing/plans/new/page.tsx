import type { Metadata } from "next";

import { BillingPlanForm } from "../_components/BillingPlanForm";
import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Novo plano de cobrança" };

export default function NewBillingPlanPage() {
  return (
    <FormPage>
      <PageHeader back={{ href: "/billing/plans", label: "Planos de cobrança" }} title="Novo plano de cobrança" />
      <BillingPlanForm />
    </FormPage>
  );
}
