"use client";

import { BackLink } from "@/components/BackLink";
import { Skeleton } from "@/components/ui/skeleton";
import { useEntryBatchesRetrieve } from "@/lib/api/generated";
import { entriesUrl } from "@/lib/entry-batch-workspace";
import { formatDate } from "@/lib/format";

import { batchOriginLabel } from "./EntryBatchListItem";

/**
 * Client Component: a data do lote aberto e, ao lado em cinza, a origem. Usa a mesma consulta da tela do lote (uma só chamada). No celular, onde a
 * lista não fica ao lado, tem o "voltar" à lista no alto.
 */
export function EntryBatchHeader({ batchId }: { batchId: string }) {
  const { data: batch } = useEntryBatchesRetrieve(batchId);

  const back = (
    <div className="lg:hidden">
      <BackLink href={entriesUrl()} label="Lançamento manual" />
    </div>
  );

  if (!batch)
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
        <h1 className="text-title tabular-nums">Lote de {formatDate(batch.batch_date)}</h1>
        <span className="text-body text-ink-soft">{batchOriginLabel(batch)}</span>
      </div>
    </>
  );
}
