import type { Metadata } from "next";

import { BillingEventForm } from "../_components/BillingEventForm";
import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Novo evento" };

export default function NewBillingEventPage() {
  return (
    <FormPage>
      <PageHeader back={{ href: "/billing/events", label: "Eventos" }} title="Novo evento" />
      <BillingEventForm />
    </FormPage>
  );
}
