import type { Metadata } from "next";

import { PhoneBackLink } from "@/components/layout/BackLink";
import { eventsUrl } from "@/lib/billing/billing-event-workspace";
import { BillingEventForm } from "../_components/BillingEventForm";

export const metadata: Metadata = { title: "Novo evento" };

export default function NewBillingEventPage() {
  return (
    <>
      <div className="mb-6">
        <PhoneBackLink href={eventsUrl()} label="Eventos" />
        <h1 className="text-title">Novo evento</h1>
      </div>
      <BillingEventForm />
    </>
  );
}
