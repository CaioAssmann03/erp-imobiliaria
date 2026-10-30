"use client";

import { usePathname } from "next/navigation";

import { FormPage } from "@/components/form/FormPage";
import { SectionIndex } from "@/components/SectionIndex";
import { EVENT_SECTIONS, eventsFrameState } from "@/lib/billing-event-workspace";
import { cn } from "@/lib/utils";
import { BillingEventsList } from "./BillingEventsList";

/**
 * Client Component: a moldura do cadastro de eventos, as 3 colunas das telas do cadastro: a lista à esquerda, o evento aberto no meio e o índice
 * de seções à direita (os dois são desta moldura, por isso continuam montados ao trocar de evento). Só envolve as telas do cadastro
 * (`eventsFrameState`); a tela vazia ocupa a largura toda. No celular, a lista e o evento aberto são telas separadas.
 */
export function BillingEventsFrame({ children }: { children: React.ReactNode }) {
  const state = eventsFrameState(usePathname());
  if (!state.hasFrame) return <>{children}</>;

  const hasEvent = state.isNew || state.eventId !== null;

  return (
    <div className="lg:flex lg:items-start lg:gap-8 2xl:gap-12">
      <BillingEventsList openEventId={state.eventId} className={state.showListOnPhone ? "flex" : "hidden lg:flex"} />
      <div className={cn("min-w-0 flex-1", !state.showPageOnPhone && "hidden lg:block")}>
        {hasEvent ? (
          <FormPage aside={<SectionIndex sections={EVENT_SECTIONS} label="Seções do evento" title="Neste evento" />}>{children}</FormPage>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
