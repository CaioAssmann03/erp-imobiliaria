"use client";

import { RecordDeleteButton } from "@/components/RecordDeleteButton";
import { getBillingEventsListQueryKey, useBillingEventsDestroy } from "@/lib/api/generated";
import { eventsUrl } from "@/lib/billing/billing-event-workspace";

/** Client Component: exclui o evento aberto (confirmação) e volta à tela de eventos, sem nenhum aberto. Um evento usado por lançamentos não sai: o backend recusa e a mensagem vem no aviso (desative em vez de excluir). */
export function BillingEventDeleteButton({ billingEventId, name }: { billingEventId: string; name: string }) {
  const destroyMutation = useBillingEventsDestroy();

  return (
    <RecordDeleteButton
      title="Excluir evento?"
      description={`O evento "${name}" será excluído. Esta ação não pode ser desfeita.`}
      destroy={(options) => destroyMutation.mutate({ id: billingEventId }, options)}
      invalidate={[getBillingEventsListQueryKey()]}
      success="Evento excluído."
      redirectTo={eventsUrl()}
    />
  );
}
