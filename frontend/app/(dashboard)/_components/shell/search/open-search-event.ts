/** Quem não está dentro da `GlobalSearch` (o botão da rail) pede a ela para abrir o painel com este evento da janela. */
export const OPEN_SEARCH_EVENT = "metri:open-search";

export const requestOpenSearch = () => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
