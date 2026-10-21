"use client";

import { Toolbar } from "@/components/data-list";
import { FilterMenu } from "@/components/FilterMenu";
import { formatMonth, recentMonths, todayIso } from "@/lib/format";

export interface RunFilterValues {
  condominium: string;
  month: string;
  status: string;
}

interface BillingRunsFiltersProps {
  filters: RunFilterValues;
  onFilterChange: (key: keyof RunFilterValues, value: string) => void;
  onClear: () => void;
  condominiums: { id: string; name: string }[];
  total?: number;
}

/** Filtros da lista de execuções: condomínio, mês de referência e situação. */
export function BillingRunsFilters({ filters, onFilterChange, onClear, condominiums, total }: BillingRunsFiltersProps) {
  return (
    <Toolbar right={total === undefined ? undefined : `${total} no total`}>
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
            key: "month",
            label: "Mês de referência",
            value: filters.month,
            onChange: (value) => onFilterChange("month", value),
            options: recentMonths(todayIso(), 12).map((month) => ({ value: month, label: formatMonth(month) })),
          },
          {
            key: "status",
            label: "Situação",
            value: filters.status,
            onChange: (value) => onFilterChange("status", value),
            options: [
              { value: "succeeded", label: "Concluídas" },
              { value: "partial", label: "Parciais" },
              { value: "failed", label: "Com falha" },
              { value: "running", label: "Em andamento" },
            ],
          },
        ]}
      />
    </Toolbar>
  );
}
