import type { Metadata } from "next";

import { BillingEventForm } from "../_components/BillingEventForm";
import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Editar evento" };

export default async function EditBillingEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <FormPage>
      <PageHeader back={{ href: "/billing/events", label: "Eventos" }} title="Editar evento" />
      <BillingEventForm billingEventId={id} />
    </FormPage>
  );
}
