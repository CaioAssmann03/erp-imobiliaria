"use client";

import { usePathname } from "next/navigation";

import { RegistryFrame } from "@/components/layout/RegistryFrame";
import { SectionIndex } from "@/components/layout/SectionIndex";
import { ENTRY_BATCH_SECTIONS, entryBatchFrameState } from "@/lib/finance/entry-batch-workspace";

import { EntryBatchesList } from "./EntryBatchesList";

/** Client Component: a moldura do lançamento manual: a lista de lotes, o lote aberto (ou o novo) e o índice de seções (`entryBatchFrameState`); a tela vazia ocupa a largura toda. */
export function EntriesFrame({ children }: { children: React.ReactNode }) {
  const state = entryBatchFrameState(usePathname());
  if (!state.hasFrame) return <>{children}</>;

  return (
    <RegistryFrame
      list={(className) => (<EntryBatchesList openBatchId={state.batchId} className={className} />)}
      aside={state.isNew || state.batchId !== null ? <SectionIndex sections={ENTRY_BATCH_SECTIONS} label="Seções do lote" title="Neste lote" /> : undefined}
      showListOnPhone={state.showListOnPhone}
      showPageOnPhone={state.showPageOnPhone}
    >
      {children}
    </RegistryFrame>
  );
}
