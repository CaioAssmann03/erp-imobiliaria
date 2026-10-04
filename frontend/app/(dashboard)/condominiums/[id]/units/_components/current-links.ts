import type { Unit } from "@/lib/api/generated/models";

/** Vínculos vigentes: sem data final ou com data final ainda no futuro. */
export function currentLinks(unit: Unit) {
  const today = new Date().toISOString().slice(0, 10);
  return unit.unit_people.filter((link) => !link.end_date || link.end_date >= today);
}
