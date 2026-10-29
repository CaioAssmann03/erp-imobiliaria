"use client";

import { SearchField, Toolbar } from "@/components/data-list";
import { FilterMenu } from "@/components/FilterMenu";
import { formatMonth, recentMonths, todayIso } from "@/lib/format";

export interface DocumentFilterValues {
  condominium: string;
  status: string;
  month: string;
  overdue: string;
  kind: string;
}

interface BillingDocumentsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  filters: DocumentFilterValues;
  onFilterChange: (key: keyof DocumentFilterValues, value: string) => void;
  onClear: () => void;
  condominiums: { id: string; name: string }[];
  total?: number;
}

/** Busca por unidade ou pagador e filtros (condomínio, situação, mês de referência, vencidos). */
export function BillingDocumentsFilters({
  search,
  onSearchChange,
  filters,
  onFilterChange,
  onClear,
  condominiums,
  total,
}: BillingDocumentsFiltersProps) {
  return (
    <Toolbar right={total === undefined ? undefined : `${total} no total`}>
      <SearchField placeholder="Buscar por unidade ou pagador" value={search} onChange={(event) => onSearchChange(event.target.value)} />
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
            label: "Situação",
            value: filters.status,
            onChange: (value) => onFilterChange("status", value),
            options: [
              { value: "issued", label: "Emitidos" },
              { value: "registered", label: "Registrados" },
              { value: "paid", label: "Pagos" },
              { value: "cancelled", label: "Cancelados" },
            ],
          },
          {
            key: "month",
            label: "Mês de referência",
            value: filters.month,
            onChange: (value) => onFilterChange("month", value),
            options: recentMonths(todayIso(), 12).map((month) => ({ value: month, label: formatMonth(month) })),
          },
          {
            key: "kind",
            label: "Tipo",
            value: filters.kind,
            onChange: (value) => onFilterChange("kind", value),
            options: [
              { value: "monthly", label: "Mensais" },
              { value: "extra", label: "Extras" },
            ],
          },
          {
            key: "overdue",
            label: "Vencimento",
            value: filters.overdue,
            onChange: (value) => onFilterChange("overdue", value),
            options: [{ value: "true", label: "Só vencidos" }],
          },
        ]}
      />
    </Toolbar>
  );
}
