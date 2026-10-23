import type { Metadata } from "next";

import { BillingRunDetail } from "../_components/BillingRunDetail";
import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Execução da emissão" };

export default async function BillingRunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <FormPage>
      <PageHeader back={{ href: "/billing/runs", label: "Execuções" }} title="Execução da emissão" />
      <BillingRunDetail runId={id} />
    </FormPage>
  );
}
