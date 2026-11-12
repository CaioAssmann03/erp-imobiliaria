import type { Metadata } from "next";

import { BillingPlanHeader } from "../_components/BillingPlanHeader";
import { BillingPlanForm } from "../_components/BillingPlanForm";

export const metadata: Metadata = { title: "Plano de cobrança" };

export default async function EditBillingPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <BillingPlanHeader planId={id} />
      <BillingPlanForm billingPlanId={id} />
    </>
  );
}
