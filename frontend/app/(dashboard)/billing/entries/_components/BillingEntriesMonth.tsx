"use client";

import { keepPreviousData } from "@tanstack/react-query";

import { ListState } from "@/components/data-list";
import { useBillingEntriesList, useCondominiumsList } from "@/lib/api/generated";
import { formatCode } from "@/lib/billing-entry-payload";
import { MAX_ENTRIES_PER_MONTH } from "@/lib/billing-entry-workspace";
import { formatMonth } from "@/lib/format";

import { BillingEntriesGrid } from "./BillingEntriesGrid";
import { useEntriesScope } from "./use-entries-scope";

/**
 * Client Component: a tela vazia da inclusão de valores, a grade do mês do condomínio escolhido na lista (uma linha por unidade, uma coluna por
 * lançamento, o total de cada boleto), em largura total e sem o menu da direita. A consulta é a mesma da lista da esquerda.
 */
export function BillingEntriesMonth() {
  const scope = useEntriesScope();
  const { data: condominiums } = useCondominiumsList({ limit: 100 });
  const { data, isLoading } = useBillingEntriesList(
    { condominium: scope.condominium, reference_month: scope.month, limit: MAX_ENTRIES_PER_MONTH },
    { query: { enabled: scope.condominium !== "", placeholderData: keepPreviousData } }
  );
  const entries = data?.results ?? [];
  const condominium = condominiums?.results.find((item) => item.id === scope.condominium);

  if (scope.condominium === "") {
    return (
      <div className="flex min-h-[24rem] flex-col items-center justify-center gap-3 rounded-card bg-surface p-10 text-center">
        <h1 className="text-heading">Escolha o condomínio</h1>
        <p className="max-w-sm text-body text-ink-soft">
          Escolha o condomínio e o mês na lista para ver os valores que entram nos boletos, além do plano de cobrança: taxas extras, água, fundo de obras...
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-title tabular-nums">Valores de {formatMonth(scope.month)}</h1>
        {condominium && (
          <span className="text-body text-ink-soft">
            {formatCode(condominium.code)} · {condominium.name}
          </span>
        )}
      </div>
      <ListState
        isLoading={isLoading}
        isEmpty={entries.length === 0}
        emptyTitle="Nenhum lançamento neste mês"
        emptyText="Os boletos do mês saem só com o plano de cobrança. Use o + da lista para somar valores a eles."
      >
        <BillingEntriesGrid entries={entries} scope={scope} />
      </ListState>
    </>
  );
}
