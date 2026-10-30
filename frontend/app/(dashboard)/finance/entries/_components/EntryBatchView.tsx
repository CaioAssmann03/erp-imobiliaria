"use client";

import { FormSection } from "@/components/form/FormSection";
import { FormSkeleton } from "@/components/form/FormSkeleton";
import { useCurrentAccountEntriesList, useEntryBatchesRetrieve } from "@/lib/api/generated";
import { formatDate } from "@/lib/format/format";
import { throwIfPageError } from "@/lib/query/page-error";

import { StatementRow } from "../../_components/StatementRow";
import { batchOriginLabel } from "./EntryBatchListItem";

/**
 * Client Component: um lote aberto, só para consulta (um lançamento nunca se altera nem se apaga): os dados do lote e os lançamentos dele, de vários
 * condomínios, cada um com o estorno. As seções `lote` e `lancamentos` são as do índice da direita.
 */
export function EntryBatchView({ batchId }: { batchId: string }) {
  const { data: batch, isLoading, error } = useEntryBatchesRetrieve(batchId);
  throwIfPageError(error);
  const { data: entries, isLoading: loadingEntries } = useCurrentAccountEntriesList({ batch: batchId, limit: 100 });

  if (isLoading) return <FormSkeleton sections={2} />;
  if (!batch) return null;

  const results = entries?.results ?? [];

  return (
    <div className="space-y-4">
      <div id="lote" className="scroll-mt-20">
        <FormSection title="Lote" description="Um lote pode reunir lançamentos de vários condomínios.">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-3">
            <div>
              <dt className="text-caption text-ink-soft">Data do lote</dt>
              <dd className="text-body tabular-nums">{formatDate(batch.batch_date)}</dd>
            </div>
            <div>
              <dt className="text-caption text-ink-soft">Origem</dt>
              <dd className="text-body">{batchOriginLabel({ origin: batch.origin, cash_number: null })}</dd>
            </div>
            {batch.cash_number ? (
              <div>
                <dt className="text-caption text-ink-soft">Número do caixa</dt>
                <dd className="text-body tabular-nums">{batch.cash_number}</dd>
              </div>
            ) : null}
          </dl>
        </FormSection>
      </div>

      <div id="lancamentos" className="scroll-mt-20">
        <FormSection title="Lançamentos" description="Um lançamento não se altera: um erro se corrige com o estorno.">
          {loadingEntries ? (
            <p className="text-body text-ink-soft">Carregando…</p>
          ) : results.length === 0 ? (
            <p className="text-body text-ink-soft">Este lote não tem lançamentos.</p>
          ) : (
            <ul className="-mx-3">
              {results.map((entry) => (
                <StatementRow key={entry.id} entry={entry} showCondominium />
              ))}
            </ul>
          )}
        </FormSection>
      </div>
    </div>
  );
}
