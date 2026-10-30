"use client";

import { usePathname } from "next/navigation";

import { FormPage } from "@/components/form/FormPage";
import { SectionIndex } from "@/components/SectionIndex";
import { ENTRY_BATCH_SECTIONS, entryBatchFrameState } from "@/lib/entry-batch-workspace";
import { cn } from "@/lib/utils";

import { EntryBatchesList } from "./EntryBatchesList";

/**
 * Client Component: a moldura do lançamento manual, as 3 colunas das telas do cadastro: a lista de lotes à esquerda, o lote aberto (ou o novo)
 * no meio e o índice de seções à direita (os dois são desta moldura, por isso continuam montados ao trocar de lote). Só envolve as telas do
 * lançamento manual (`entryBatchFrameState`); a tela vazia ocupa a largura toda. No celular, a lista e o lote são telas separadas.
 */
export function EntriesFrame({ children }: { children: React.ReactNode }) {
  const state = entryBatchFrameState(usePathname());
  if (!state.hasFrame) return <>{children}</>;

  const hasBatch = state.isNew || state.batchId !== null;

  return (
    <div className="lg:flex lg:items-start lg:gap-8 2xl:gap-12">
      <EntryBatchesList openBatchId={state.batchId} className={state.showListOnPhone ? "flex" : "hidden lg:flex"} />
      <div className={cn("min-w-0 flex-1", !state.showPageOnPhone && "hidden lg:block")}>
        {hasBatch ? <FormPage aside={<SectionIndex sections={ENTRY_BATCH_SECTIONS} label="Seções do lote" title="Neste lote" />}>{children}</FormPage> : children}
      </div>
    </div>
  );
}
