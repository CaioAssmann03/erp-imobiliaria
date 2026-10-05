"use client";

import { SearchField } from "@/components/data-list";
import { FilterMenu } from "@/components/FilterMenu";

const STATUS_OPTIONS = [
  { value: "active", label: "Ativos" },
  { value: "inactive", label: "Inativos" },
];

const TYPE_OPTIONS = [
  { value: "residential", label: "Residencial" },
  { value: "commercial", label: "Comercial" },
];

const PENDING_OPTIONS = [
  { value: "without_cost_centers", label: "Sem sub-contas" },
  { value: "inconsistent_apportionment", label: "Rateio não fecha 100%" },
  { value: "overdue_adjustment", label: "Reajuste atrasado" },
  { value: "upcoming_adjustment", label: "Reajuste em 30 dias" },
];

type FilterKey = "status" | "type" | "pending";

interface CondominiumsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  filters: Record<FilterKey, string>;
  onFilterChange: (key: FilterKey, value: string) => void;
  onClear: () => void;
}

/** Busca por texto e filtros de status e tipo de condomínio. */
export function CondominiumsFilters({
  search,
  onSearchChange,
  filters,
  onFilterChange,
  onClear,
}: CondominiumsFiltersProps) {
  return (
    <>
      <SearchField
        placeholder="Buscar por nome ou CNPJ"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      <FilterMenu
        onClear={onClear}
        groups={[
          {
            key: "status",
            label: "Status",
            value: filters.status,
            onChange: (value) => onFilterChange("status", value),
            options: STATUS_OPTIONS,
          },
          {
            key: "type",
            label: "Tipo",
            value: filters.type,
            onChange: (value) => onFilterChange("type", value),
            options: TYPE_OPTIONS,
          },
          {
            key: "pending",
            label: "Pendência",
            value: filters.pending,
            onChange: (value) => onFilterChange("pending", value),
            options: PENDING_OPTIONS,
          },
        ]}
      />
    </>
  );
}
