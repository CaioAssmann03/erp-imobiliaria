"use client";

import { FilterMenu } from "@/components/FilterMenu";
import type { Block } from "@/lib/api/generated/models";
import { UNIT_TYPES } from "@/lib/schemas/unit";

export const PENDING_OPTIONS = [
  { value: "without_responsible", label: "Sem responsável" },
  { value: "lease_ending", label: "Locação terminando" },
  { value: "billing_blocked", label: "Lançamento bloqueado" },
];

type FilterKey = "status" | "type" | "block" | "condominium" | "pending";

interface UnitsFiltersProps {
  blocks: readonly Block[];
  /** Só na visão geral (todos os condomínios). */
  condominiums?: readonly { id: string; name: string }[];
  filters: Record<FilterKey, string>;
  onFilterChange: (key: FilterKey, value: string) => void;
  onClear: () => void;
}

/** Filtros de status, tipo e bloco (o de bloco só aparece se o condomínio tiver blocos). */
export function UnitsFilters({ blocks, condominiums, filters, onFilterChange, onClear }: UnitsFiltersProps) {
  return (
    <FilterMenu
      onClear={onClear}
      groups={[
        ...(condominiums
          ? [
              {
                key: "condominium",
                label: "Condomínio",
                value: filters.condominium,
                onChange: (value: string) => onFilterChange("condominium", value),
                options: condominiums.map((item) => ({ value: item.id, label: item.name })),
                searchable: true,
              },
            ]
          : []),
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
          key: "pending",
          label: "Pendência",
          value: filters.pending,
          onChange: (value: string) => onFilterChange("pending", value),
          options: PENDING_OPTIONS,
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
                searchable: true,
              },
            ]
          : []),
      ]}
    />
  );
}
