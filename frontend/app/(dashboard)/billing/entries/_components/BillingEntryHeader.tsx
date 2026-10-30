"use client";

import { BackLink } from "@/components/layout/BackLink";
import { Skeleton } from "@/components/ui/skeleton";
import { useBillingEntriesRetrieve } from "@/lib/api/generated";
import { billingEntriesUrl } from "@/lib/billing/billing-entry-workspace";

import { entryDestinationLabel } from "./BillingEntryListItem";
import { useEntriesScope } from "./use-entries-scope";

/**
 * Client Component: o nome do boleto do lançamento aberto e, ao lado em cinza, a sub-conta. Usa a mesma consulta da tela do lançamento (uma só chamada).
 * No celular, onde a lista não fica ao lado, tem o "voltar" à lista no alto.
 */
export function BillingEntryHeader({ entryId }: { entryId: string }) {
  const scope = useEntriesScope();
  const { data: entry } = useBillingEntriesRetrieve(entryId);

  const back = (
    <div className="lg:hidden">
      <BackLink href={billingEntriesUrl(scope)} label="Inclusão de valores" />
    </div>
  );

  if (!entry)
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
        <h1 className="text-title">{[entry.event_name, entry.description].filter(Boolean).join(" - ")}</h1>
        <span className="text-body text-ink-soft">{entryDestinationLabel(entry)}</span>
      </div>
    </>
  );
}
