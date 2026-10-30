import { redirect } from "next/navigation";

import { eventUrl } from "@/lib/billing-event-workspace";

/** O cadastro de eventos mudou para dentro de Condomínios: um link antigo abre a nova tela. */
export default async function EditBillingEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(eventUrl(id));
}
