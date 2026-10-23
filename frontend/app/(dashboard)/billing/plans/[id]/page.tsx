import type { Metadata } from "next";

import { BillingPlanForm } from "../_components/BillingPlanForm";
import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Editar plano de cobrança" };

export default async function EditBillingPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <FormPage>
      <PageHeader back={{ href: "/billing/plans", label: "Planos de cobrança" }} title="Editar plano de cobrança" />
      <BillingPlanForm billingPlanId={id} />
    </FormPage>
  );
}
