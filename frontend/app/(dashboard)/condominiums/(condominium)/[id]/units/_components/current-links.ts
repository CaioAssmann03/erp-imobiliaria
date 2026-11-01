import type { Unit } from "@/lib/api/generated/models";

/** Vínculos vigentes: quem diz é a API (`is_current`, com a data do servidor), não o relógio do navegador. */
export function currentLinks(unit: Unit) {
  return unit.unit_people.filter((link) => link.is_current);
}
