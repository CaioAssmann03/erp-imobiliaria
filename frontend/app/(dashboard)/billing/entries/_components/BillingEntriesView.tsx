"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { ListState } from "@/components/data-list";
import { Button } from "@/components/ui/button";
import { useBillingEntriesList, useCondominiumsList } from "@/lib/api/generated";
import { currentMonthTyped, maskMonthYear, monthToApi } from "@/lib/billing-plan-payload";
import { inputClass } from "@/lib/ui";

import { BillingEntriesGrid } from "./BillingEntriesGrid";
import { NewEntrySheet } from "./NewEntrySheet";

const MAX_ENTRIES_PER_MONTH = 100;

/** Client Component: escolhe o condomínio e o mês, mostra a grade de lançamentos e abre o painel de novo lançamento. */
export function BillingEntriesView() {
  const [condominium, setCondominium] = useState(useSearchParams().get("condominium") ?? "");
  const [month, setMonth] = useState(currentMonthTyped());
  const [isSheetOpen, setSheetOpen] = useState(false);
  const referenceMonth = monthToApi(month);

  const { data: condominiums } = useCondominiumsList({ limit: 100 });
  const { data, isLoading } = useBillingEntriesList(
    { condominium, reference_month: referenceMonth, limit: MAX_ENTRIES_PER_MONTH },
    { query: { enabled: condominium !== "" && referenceMonth !== undefined, placeholderData: keepPreviousData } }
  );
  const entries = data?.results ?? [];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-card bg-card p-4 shadow-card">
        <div className="flex min-w-60 flex-1 flex-col">
          <label htmlFor="entries-condominium" className="mb-1.5 text-caption font-medium text-ink-soft">
            Condomínio
          </label>
          <select id="entries-condominium" className={inputClass} value={condominium} onChange={(event) => setCondominium(event.target.value)}>
            <option value="">Selecione</option>
            {(condominiums?.results ?? []).map((item) => (
              <option key={item.id} value={item.id}>
                {item.code} - {item.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex w-36 flex-col">
          <label htmlFor="entries-month" className="mb-1.5 text-caption font-medium text-ink-soft">
            Referência
          </label>
          <input
            id="entries-month"
            inputMode="numeric"
            placeholder="MM/AAAA"
            maxLength={7}
            className={inputClass}
            aria-invalid={referenceMonth === undefined ? true : undefined}
            value={month}
            onChange={(event) => setMonth(maskMonthYear(event.target.value))}
          />
        </div>
        <Button type="button" disabled={condominium === ""} onClick={() => setSheetOpen(true)}>
          <Plus className="size-4" />
          Incluir lançamento
        </Button>
      </div>

      {condominium === "" ? (
        <p className="rounded-card bg-card p-6 text-body text-ink-soft shadow-card">Escolha o condomínio para ver e incluir os valores do mês.</p>
      ) : referenceMonth === undefined ? (
        <p className="rounded-card bg-card p-6 text-body text-ink-soft shadow-card">Informe a referência no formato mês/ano, ex.: 10/2026.</p>
      ) : (
        <ListState
          isLoading={isLoading}
          isEmpty={entries.length === 0}
          emptyTitle="Nenhum lançamento neste mês"
          emptyText="Os boletos do mês saem só com o plano de cobrança. Use “Incluir lançamento” para somar valores a eles."
        >
          <BillingEntriesGrid entries={entries} referenceMonth={referenceMonth} />
        </ListState>
      )}

      <NewEntrySheet open={isSheetOpen} onOpenChange={setSheetOpen} condominium={condominium} month={month} />
    </>
  );
}
