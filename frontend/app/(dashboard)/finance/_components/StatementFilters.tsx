"use client";

import { SearchField } from "@/components/data-list";
import { FilterMenu } from "@/components/FilterMenu";
import { formatMonth, recentMonths, todayIso } from "@/lib/format";
import { ENTRY_KINDS } from "@/lib/schemas/entry-batch";

/** O período é um intervalo pronto (calculado pela tabela), como os demais filtros do menu. */
export const PERIOD_OPTIONS = [
  { value: "this_month", label: "Este mês" },
  { value: "last_month", label: "Mês passado" },
  { value: "last_30_days", label: "Últimos 30 dias" },
];

type FilterKey = "kind" | "period" | "competence";

interface StatementFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  filters: Record<FilterKey, string>;
  onFilterChange: (key: FilterKey, value: string) => void;
  onClear: () => void;
  /** O condomínio do extrato vem da URL: trocá-lo navega, não filtra. */
  condominium: string;
  onCondominiumChange: (value: string) => void;
  condominiums: readonly { value: string; label: string }[];
}

export function StatementFilters({
  search,
  onSearchChange,
  filters,
  onFilterChange,
  onClear,
  condominium,
  onCondominiumChange,
  condominiums,
}: StatementFiltersProps) {
  return (
    <>
      <SearchField
        placeholder="Buscar na descrição"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      <FilterMenu
        onClear={onClear}
        groups={[
          {
            key: "condominium",
            label: "Condomínio",
            searchable: true,
            value: condominium,
            onChange: onCondominiumChange,
            options: condominiums,
          },
          {
            key: "period",
            label: "Período",
            value: filters.period,
            onChange: (value) => onFilterChange("period", value),
            options: PERIOD_OPTIONS,
          },
          {
            key: "competence",
            label: "Mês de referência",
            value: filters.competence,
            onChange: (value) => onFilterChange("competence", value),
            options: recentMonths(todayIso(), 12).map((month) => ({ value: month, label: formatMonth(month) })),
          },
          {
            key: "kind",
            label: "Tipo",
            value: filters.kind,
            onChange: (value) => onFilterChange("kind", value),
            options: ENTRY_KINDS,
          },
        ]}
      />
    </>
  );
}
