/** As seções do cadastro do condomínio (uma por vez na tela, escolhidas por `?section=`). */
export const FORM_SECTIONS = [
  { id: "identification", label: "Identificação" },
  { id: "address", label: "Endereço" },
  { id: "fee", label: "Taxa de administração" },
  { id: "billing", label: "Cobrança" },
  { id: "adjustment", label: "Reajuste" },
  { id: "apportionment", label: "Rateio" },
] as const;

export type FormSectionId = (typeof FORM_SECTIONS)[number]["id"];

export const DEFAULT_FORM_SECTION: FormSectionId = "identification";

/** Valor da URL → seção válida (qualquer outra coisa cai na primeira). */
export function parseFormSection(value: string | null): FormSectionId {
  return FORM_SECTIONS.find((section) => section.id === value)?.id ?? DEFAULT_FORM_SECTION;
}

export function formSectionHref(base: string, id: FormSectionId) {
  return id === DEFAULT_FORM_SECTION ? base : `${base}?section=${id}`;
}

/** Troca a seção sem pedir nada ao servidor: o Next acompanha o `pushState` em `useSearchParams`. */
export function showFormSection(id: FormSectionId) {
  window.history.pushState(null, "", formSectionHref(window.location.pathname, id));
}
