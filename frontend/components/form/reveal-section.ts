/**
 * Formulários que mostram uma seção por vez marcam cada painel com `data-section="<id>"` (e `hidden` nos fechados).
 * Quem precisa de um campo de um painel fechado (o resumo de erros) pede para abri-lo; o formulário escuta e abre.
 */
export const REVEAL_FORM_SECTION_EVENT = "reveal-form-section";

/** Abre o painel que contém o campo, se estiver fechado. Devolve true quando precisou abrir. */
export function revealSectionOf(fieldName: string): boolean {
  const panel = document
    .querySelector<HTMLElement>(`[name="${CSS.escape(fieldName)}"]`)
    ?.closest<HTMLElement>("[data-section]");
  if (!panel?.hidden || !panel.dataset.section) return false;
  window.dispatchEvent(new CustomEvent(REVEAL_FORM_SECTION_EVENT, { detail: panel.dataset.section }));
  return true;
}
