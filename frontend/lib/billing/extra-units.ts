import { unitsList } from "../api/generated/units/units.ts";
import type { Unit } from "../api/generated/models/unit.ts";

/** Quantas unidades a API entrega por página (o máximo dela). */
const PAGE_SIZE = 100;

/** Todas as unidades ativas de um condomínio (ou de um bloco), página por página: um condomínio grande não fica cortado nas primeiras 100. */
export async function fetchActiveUnits(condominium: string, block?: string): Promise<Unit[]> {
  const units: Unit[] = [];
  for (let page = 1; ; page += 1) {
    const result = await unitsList({ condominium, active: true, limit: PAGE_SIZE, page, ...(block ? { block } : {}) });
    units.push(...result.results);
    if (!result.next) return units;
  }
}

/** As unidades ativas dos blocos escolhidos, sem repetir nenhuma. */
export async function fetchActiveUnitsOfBlocks(condominium: string, blocks: readonly string[]): Promise<Unit[]> {
  const found = await Promise.all(blocks.map((block) => fetchActiveUnits(condominium, block)));
  return [...new Map(found.flat().map((unit) => [unit.id, unit])).values()];
}
