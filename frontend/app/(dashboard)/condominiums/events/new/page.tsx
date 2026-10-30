import type { Metadata } from "next";

import { BackLink } from "@/components/BackLink";
import { eventsUrl } from "@/lib/billing-event-workspace";
import { BillingEventForm } from "../_components/BillingEventForm";

export const metadata: Metadata = { title: "Novo evento" };

export default function NewBillingEventPage() {
  return (
    <>
      <div className="mb-6">
        <div className="lg:hidden">
          <BackLink href={eventsUrl()} label="Eventos" />
        </div>
        <h1 className="text-title">Novo evento</h1>
      </div>
      <BillingEventForm />
    </>
  );
}
