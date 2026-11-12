import type { Metadata } from "next";

import { NewBillingPlanHeader } from "../_components/BillingPlanHeader";
import { BillingPlanForm } from "../_components/BillingPlanForm";

export const metadata: Metadata = { title: "Novo plano de cobrança" };

export default function NewBillingPlanPage() {
  return (
    <>
      <NewBillingPlanHeader />
      <BillingPlanForm />
    </>
  );
}
