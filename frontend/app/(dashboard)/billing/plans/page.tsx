import type { Metadata } from "next";

import { BillingPlansHome } from "./_components/BillingPlansHome";

export const metadata: Metadata = { title: "Planos de cobrança" };

export default function BillingPlansPage() {
  return <BillingPlansHome />;
}
