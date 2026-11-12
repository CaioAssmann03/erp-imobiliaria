import type { Metadata } from "next";

import { BillingRunDetail } from "../_components/BillingRunDetail";
import { BillingRunHeader } from "../_components/BillingRunHeader";

export const metadata: Metadata = { title: "Execução da emissão" };

export default async function BillingRunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <BillingRunHeader runId={id} />
      <BillingRunDetail runId={id} />
    </>
  );
}
