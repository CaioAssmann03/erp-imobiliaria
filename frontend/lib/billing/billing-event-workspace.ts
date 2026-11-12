import { registryFrame } from "../navigation/registry-frame.ts";

/** Seções da página de um evento, na ordem em que aparecem; o índice da direita usa estes ids. */
export const EVENT_SECTIONS = [{ id: "identificacao", label: "Identificação" }] as const;

export const eventsUrl = () => "/condominiums/events";
export const newEventUrl = () => "/condominiums/events/new";
export const eventUrl = (eventId: string) => `/condominiums/events/${eventId}`;

export interface EventsFrameState {
  /** A coluna da lista só envolve as telas do cadastro de eventos: a vazia, o cadastro novo e o evento aberto. */
  hasFrame: boolean;
  eventId: string | null;
  isNew: boolean;
  /** No celular a lista e o evento aberto são telas separadas. */
  showListOnPhone: boolean;
  showPageOnPhone: boolean;
}

/** Que moldura uma URL tem: `/condominiums/events` (a vazia), `/condominiums/events/new` e `/condominiums/events/[eventId]`. */
export function eventsFrameState(pathname: string | null): EventsFrameState {
  const { id, ...frame } = registryFrame(pathname, "condominiums", "events");
  return { ...frame, eventId: id };
}
