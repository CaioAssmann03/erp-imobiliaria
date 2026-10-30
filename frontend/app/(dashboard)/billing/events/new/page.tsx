import { redirect } from "next/navigation";

import { newEventUrl } from "@/lib/billing-event-workspace";

/** O cadastro de eventos mudou para dentro de Condomínios: um link antigo abre a nova tela. */
export default function NewBillingEventPage() {
  redirect(newEventUrl());
}
