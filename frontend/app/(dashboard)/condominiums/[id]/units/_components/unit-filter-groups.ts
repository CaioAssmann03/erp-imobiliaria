import type { FilterGroup } from "@/components/FilterMenu";
import type { Block } from "@/lib/api/generated/models";
import { UNIT_TYPES } from "@/lib/schemas/unit";

import { PENDING_OPTIONS } from "./UnitsFilters";

export interface UnitFilters {
  block: string;
  type: string;
  status: string;
  /** Só vem da URL (atalho das pendências do dashboard); o seletor só aparece quando há uma. */
  pending: string;
}

export const NO_UNIT_FILTERS: UnitFilters = { block: "", type: "", status: "", pending: "" };

/** Os filtros das listas de unidades (bloco só se o condomínio tem blocos; pendência só quando veio da URL), para o `CompactFilter`. */
export function unitFilterGroups(
  blocks: readonly Block[],
  filters: UnitFilters,
  onChange: (key: keyof UnitFilters, value: string) => void
): FilterGroup[] {
  return [
    ...(blocks.length > 0
      ? [
          {
            key: "block",
            label: "Bloco",
            value: filters.block,
            onChange: (value: string) => onChange("block", value),
            options: blocks.map((block) => ({ value: block.id, label: block.name })),
          },
        ]
      : []),
    { key: "type", label: "Tipo", value: filters.type, onChange: (value) => onChange("type", value), options: UNIT_TYPES },
    {
      key: "status",
      label: "Situação",
      value: filters.status,
      onChange: (value) => onChange("status", value),
      options: [
        { value: "active", label: "Ativas" },
        { value: "inactive", label: "Inativas" },
      ],
    },
    ...(filters.pending
      ? [
          {
            key: "pending",
            label: "Pendência",
            value: filters.pending,
            onChange: (value: string) => onChange("pending", value),
            options: PENDING_OPTIONS,
          },
        ]
      : []),
  ];
}
