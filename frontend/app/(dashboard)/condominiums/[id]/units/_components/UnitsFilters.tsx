"use client";

import { FilterMenu } from "@/components/FilterMenu";
import type { Block } from "@/lib/api/generated/models";
import { UNIT_TYPES } from "@/lib/schemas/unit";

type FilterKey = "status" | "type" | "block";

interface UnitsFiltersProps {
  blocks: readonly Block[];
  filters: Record<FilterKey, string>;
  onFilterChange: (key: FilterKey, value: string) => void;
  onClear: () => void;
}

/** Filtros de status, tipo e bloco (o de bloco só aparece se o condomínio tiver blocos). */
export function UnitsFilters({ blocks, filters, onFilterChange, onClear }: UnitsFiltersProps) {
  return (
    <FilterMenu
      onClear={onClear}
      groups={[
        {
          key: "status",
          label: "Status",
          value: filters.status,
          onChange: (value) => onFilterChange("status", value),
          options: [
            { value: "active", label: "Ativas" },
            { value: "inactive", label: "Inativas" },
          ],
        },
        {
          key: "type",
          label: "Tipo",
          value: filters.type,
          onChange: (value) => onFilterChange("type", value),
          options: UNIT_TYPES,
        },
        ...(blocks.length > 0
          ? [
              {
                key: "block",
                label: "Bloco",
                value: filters.block,
                onChange: (value: string) => onFilterChange("block", value),
                options: blocks.map((block) => ({ value: block.id, label: block.name })),
              },
            ]
          : []),
      ]}
    />
  );
}
