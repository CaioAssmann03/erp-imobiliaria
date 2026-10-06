"use client";

import { SearchField } from "@/components/data-list";
import { FilterMenu } from "@/components/FilterMenu";

const STATUS_OPTIONS = [
  { value: "active", label: "Ativos" },
  { value: "inactive", label: "Inativos" },
];

const TYPE_OPTIONS = [
  { value: "individual", label: "Física" },
  { value: "legal", label: "Jurídica" },
];

type FilterKey = "status" | "type";

interface PersonsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  filters: Record<FilterKey, string>;
  onFilterChange: (key: FilterKey, value: string) => void;
  onClear: () => void;
}

export function PersonsFilters({
  search,
  onSearchChange,
  filters,
  onFilterChange,
  onClear,
}: PersonsFiltersProps) {
  return (
    <>
      <SearchField
        placeholder="Buscar por nome, CPF/CNPJ ou email"
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
            label: "Tipo de pessoa",
            value: filters.type,
            onChange: (value) => onFilterChange("type", value),
            options: TYPE_OPTIONS,
          },
        ]}
      />
    </>
  );
}
