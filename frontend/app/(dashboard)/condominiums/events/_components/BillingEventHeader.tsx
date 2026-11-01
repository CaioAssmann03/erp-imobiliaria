"use client";

import { PhoneBackLink } from "@/components/layout/BackLink";
import { RegistryHeader } from "@/components/layout/RegistryHeader";
import { useBillingEventsRetrieve } from "@/lib/api/generated";
import { eventsUrl } from "@/lib/billing/billing-event-workspace";

/**
 * Client Component: o código (cinza, como na lista ao lado), o nome e a situação do evento aberto, a situação em texto simples (verde ativo,
 * preto inativo). Usa a mesma consulta do formulário (uma só chamada); o Excluir fica na barra de ações dele. No celular, onde a lista não fica
 * ao lado, tem o "voltar" à lista no alto.
 */
export function BillingEventHeader({ billingEventId }: { billingEventId: string }) {
  const { data: event } = useBillingEventsRetrieve(billingEventId);

  return (
    <RegistryHeader
      back={<PhoneBackLink href={eventsUrl()} label="Eventos" />}
      record={event && { code: event.code, name: event.name, active: event.active ?? true }}
    />
  );
}
