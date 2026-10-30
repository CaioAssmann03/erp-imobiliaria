import type { Metadata } from "next";

import { BillingEventForm } from "../_components/BillingEventForm";
import { BillingEventHeader } from "../_components/BillingEventHeader";

export const metadata: Metadata = { title: "Evento" };

export default async function EditBillingEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <BillingEventHeader billingEventId={id} />
      <BillingEventForm billingEventId={id} />
    </>
  );
}
