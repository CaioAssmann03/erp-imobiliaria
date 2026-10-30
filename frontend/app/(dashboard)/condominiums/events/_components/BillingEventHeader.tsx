"use client";

import { BackLink } from "@/components/layout/BackLink";
import { StatusText } from "@/components/StatusText";
import { Skeleton } from "@/components/ui/skeleton";
import { useBillingEventsRetrieve } from "@/lib/api/generated";
import { formatCode } from "@/lib/billing/billing-entry-payload";
import { eventsUrl } from "@/lib/billing/billing-event-workspace";

/**
 * Client Component: o código (cinza, como na lista ao lado), o nome e a situação do evento aberto, a situação em texto simples (verde ativo,
 * preto inativo). Usa a mesma consulta do formulário (uma só chamada); o Excluir fica na barra de ações dele. No celular, onde a lista não fica
 * ao lado, tem o "voltar" à lista no alto.
 */
export function BillingEventHeader({ billingEventId }: { billingEventId: string }) {
  const { data: event } = useBillingEventsRetrieve(billingEventId);

  const back = (
    <div className="lg:hidden">
      <BackLink href={eventsUrl()} label="Eventos" />
    </div>
  );

  if (!event)
    return (
      <>
        {back}
        <Skeleton className="mb-6 h-9 w-72 rounded-control" />
      </>
    );

  return (
    <>
      {back}
      <div className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-title">
          <span className="tabular-nums text-ink-faint">{formatCode(event.code)}</span>
          <span className="text-ink-faint"> · </span>
          {event.name}
        </h1>
        <StatusText active={event.active ?? true} />
      </div>
    </>
  );
}
