"use client";

import { SearchField } from "@/components/data-list";
import { FilterMenu } from "@/components/FilterMenu";
import { PAYABLE_STATUSES } from "@/lib/schemas/account-payable";

const HOLDER_OPTIONS = [
  { value: "condominium", label: "De condomínios" },
  { value: "company", label: "Da empresa" },
];

/** O vencimento é um período pronto (calculado pela tabela), como os demais filtros do menu. */
export const DUE_OPTIONS = [
  { value: "overdue", label: "Vencidas" },
  { value: "today", label: "Vencem hoje" },
  { value: "next_7_days", label: "Próximos 7 dias" },
  { value: "this_month", label: "Neste mês" },
];

type FilterKey = "status" | "holder" | "condominium" | "due";

interface AccountsPayableFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  filters: Record<FilterKey, string>;
  onFilterChange: (key: FilterKey, value: string) => void;
  onClear: () => void;
  condominiums: readonly { value: string; label: string }[];
}

export function AccountsPayableFilters({
  search,
  onSearchChange,
  filters,
  onFilterChange,
  onClear,
  condominiums,
}: AccountsPayableFiltersProps) {
  return (
    <>
      <SearchField
        placeholder="Buscar por descrição, documento ou fornecedor"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      <FilterMenu
        onClear={onClear}
        groups={[
          {
            key: "status",
            label: "Situação",
            value: filters.status,
            onChange: (value) => onFilterChange("status", value),
            options: PAYABLE_STATUSES,
          },
          {
            key: "due",
            label: "Vencimento",
            value: filters.due,
            onChange: (value) => onFilterChange("due", value),
            options: DUE_OPTIONS,
          },
          {
            key: "holder",
            label: "Despesa",
            value: filters.holder,
            onChange: (value) => onFilterChange("holder", value),
            options: HOLDER_OPTIONS,
          },
          {
            key: "condominium",
            label: "Condomínio",
            searchable: true,
            value: filters.condominium,
            onChange: (value) => onFilterChange("condominium", value),
            options: condominiums,
          },
        ]}
      />
    </>
  );
}
