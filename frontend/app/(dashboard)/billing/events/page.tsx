import { redirect } from "next/navigation";

import { eventsUrl } from "@/lib/billing-event-workspace";

/** O cadastro de eventos mudou para dentro de Condomínios: um link antigo abre a nova tela. */
export default function BillingEventsPage() {
  redirect(eventsUrl());
}
