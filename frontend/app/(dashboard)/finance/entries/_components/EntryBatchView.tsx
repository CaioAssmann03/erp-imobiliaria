"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { useState } from "react";

import { Pagination } from "@/components/data-list/Pagination";
import { FormSection } from "@/components/form/FormSection";
import { FormSkeleton } from "@/components/form/FormSkeleton";
import { useCurrentAccountEntriesList, useEntryBatchesRetrieve } from "@/lib/api/generated";
import { formatDate } from "@/lib/format/format";
import { throwIfPageError } from "@/lib/query/page-error";
import { cn } from "@/lib/utils";

import { StatementRow } from "../../_components/StatementRow";
import { batchOriginLabel } from "./EntryBatchListItem";
import { SectionAnchor } from "@/components/form/SectionAnchor";

/** Os lançamentos do lote vêm 10 por página, como nas demais tabelas paginadas. */
const ENTRY_PAGE_SIZES = [10, 25, 50, 100];

/**
 * Client Component: um lote aberto, só para consulta (um lançamento nunca se altera nem se apaga): os dados do lote numa fileira (a explicação de que ele
 * reúne vários condomínios fica atrás do "i" do título) e os lançamentos dele, 10 por página com o seletor de itens por página, cada um com o estorno.
 * As seções `lote` e `lancamentos` são as do índice da direita.
 */
export function EntryBatchView({ batchId }: { batchId: string }) {
  const { data: batch, isLoading, error } = useEntryBatchesRetrieve(batchId);
  throwIfPageError(error);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(ENTRY_PAGE_SIZES[0]);
  const {
    data: entries,
    isLoading: loadingEntries,
    isPlaceholderData,
  } = useCurrentAccountEntriesList({ batch: batchId, limit, ...(page > 1 ? { page } : {}) }, { query: { placeholderData: keepPreviousData } });

  if (isLoading) return <FormSkeleton sections={2} />;
  if (!batch) return null;

  const results = entries?.results ?? [];

  return (
    <div className="space-y-4">
      <SectionAnchor id="lote">
        <FormSection title="Lote" hint="Um lote pode reunir lançamentos de vários condomínios.">
          <dl className="flex flex-wrap gap-x-10 gap-y-3">
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
      </SectionAnchor>

      <SectionAnchor id="lancamentos">
        <FormSection title="Lançamentos" description="Um lançamento não se altera: um erro se corrige com o estorno.">
          {loadingEntries ? (
            <p className="text-body text-ink-soft">Carregando…</p>
          ) : results.length === 0 ? (
            <p className="text-body text-ink-soft">Este lote não tem lançamentos.</p>
          ) : (
            <>
              <ul className={cn("-mx-3 transition-opacity", isPlaceholderData && "opacity-60")}>
                {results.map((entry) => (
                  <StatementRow key={entry.id} entry={entry} showCondominium />
                ))}
              </ul>
              <Pagination
                page={page}
                limit={limit}
                count={entries?.count ?? 0}
                pageSizes={ENTRY_PAGE_SIZES}
                onPageChange={setPage}
                onLimitChange={(size) => {
                  setLimit(size);
                  setPage(1);
                }}
              />
            </>
          )}
        </FormSection>
      </SectionAnchor>
    </div>
  );
}
