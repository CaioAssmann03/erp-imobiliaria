"use client";

import { usePathname } from "next/navigation";

import { RegistryFrame } from "@/components/layout/RegistryFrame";
import { SectionIndex } from "@/components/layout/SectionIndex";
import { EVENT_SECTIONS, eventsFrameState } from "@/lib/billing/billing-event-workspace";

import { BillingEventsList } from "./BillingEventsList";

/** Client Component: a moldura do cadastro de eventos: a lista, o evento aberto e o índice de seções (`eventsFrameState`); a tela vazia ocupa a largura toda. */
export function BillingEventsFrame({ children }: { children: React.ReactNode }) {
  const state = eventsFrameState(usePathname());
  if (!state.hasFrame) return <>{children}</>;

  return (
    <RegistryFrame
      list={(className) => (<BillingEventsList openEventId={state.eventId} className={className} />)}
      aside={state.isNew || state.eventId !== null ? <SectionIndex sections={EVENT_SECTIONS} label="Seções do evento" title="Neste evento" /> : undefined}
      showListOnPhone={state.showListOnPhone}
      showPageOnPhone={state.showPageOnPhone}
    >
      {children}
    </RegistryFrame>
  );
}
