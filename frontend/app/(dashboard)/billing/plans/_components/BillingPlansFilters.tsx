"use client";

import { SearchField, Toolbar } from "@/components/data-list";
import { FilterMenu } from "@/components/FilterMenu";

interface BillingPlansFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  filters: { condominium: string; status: string };
  onFilterChange: (key: "condominium" | "status", value: string) => void;
  onClear: () => void;
  condominiums: { id: string; name: string }[];
  total?: number;
}

/** Busca por nome e filtros (condomínio, situação) da lista de planos. */
export function BillingPlansFilters({
  search,
  onSearchChange,
  filters,
  onFilterChange,
  onClear,
  condominiums,
  total,
}: BillingPlansFiltersProps) {
  return (
    <Toolbar right={total === undefined ? undefined : `${total} no total`}>
      <SearchField placeholder="Buscar por nome" value={search} onChange={(event) => onSearchChange(event.target.value)} />
      <FilterMenu
        onClear={onClear}
        groups={[
          {
            key: "condominium",
            label: "Condomínio",
            searchable: true,
            value: filters.condominium,
            onChange: (value) => onFilterChange("condominium", value),
            options: condominiums.map((item) => ({ value: item.id, label: item.name })),
          },
          {
            key: "status",
            label: "Status",
            value: filters.status,
            onChange: (value) => onFilterChange("status", value),
            options: [
              { value: "active", label: "Ativos" },
              { value: "inactive", label: "Inativos" },
            ],
          },
        ]}
      />
    </Toolbar>
  );
}
