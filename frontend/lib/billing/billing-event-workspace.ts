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
  const none: EventsFrameState = { hasFrame: false, eventId: null, isNew: false, showListOnPhone: false, showPageOnPhone: true };
  if (!pathname) return none;
  const [, root, second, third, extra] = pathname.split("/");
  if (root !== "condominiums" || second !== "events" || extra !== undefined) return none;

  if (third === undefined || third === "") {
    return { ...none, hasFrame: true, showListOnPhone: true, showPageOnPhone: false };
  }
  if (third === "new") return { ...none, hasFrame: true, isNew: true };
  return { ...none, hasFrame: true, eventId: third };
}
