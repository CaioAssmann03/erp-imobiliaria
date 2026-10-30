"use client";

import { Search } from "lucide-react";

import { CompactFilter, type CompactFilterGroup } from "@/components/filters/CompactFilter";
import { MonthSelect } from "@/components/dates/MonthSelect";
import { todayIso } from "@/lib/format/format";
import { ENTRY_KINDS } from "@/lib/schemas/entry-batch";

/** O período é um intervalo pronto (calculado pela tela), como os demais filtros do menu. */
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
}

/**
 * A busca e os filtros dos lançamentos, no padrão da busca das listas de Unidades: um campo quadrado de cantos arredondados, com o ícone, a busca
 * pela descrição e o filtro discreto dentro (`CompactFilter`: período e tipo) e, num campo igual à direita, o mês de referência como calendário (`MonthSelect`). Como fica dentro de um cartão
 * branco, o campo é cinza claro.
 */
export function StatementFilters({ search, onSearchChange, filters, onFilterChange, onClear }: StatementFiltersProps) {
  const groups: CompactFilterGroup[] = [
    {
      key: "period",
      label: "Período",
      value: filters.period,
      onChange: (value) => onFilterChange("period", value),
      options: PERIOD_OPTIONS,
    },
    {
      key: "kind",
      label: "Tipo",
      value: filters.kind,
      onChange: (value) => onFilterChange("kind", value),
      options: ENTRY_KINDS,
    },
  ];

  return (
    <div className="flex items-center gap-2">
      <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-control bg-surface-muted pr-1.5 pl-3 text-ink-soft focus-within:ring-2 focus-within:ring-brand/50">
        <Search className="size-4 shrink-0" />
        <input
          type="search"
          aria-label="Buscar na descrição"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar na descrição"
          className="min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-faint"
        />
        <CompactFilter groups={groups} onClear={onClear} />
      </div>
      <div className="h-10 shrink-0 rounded-control bg-surface-muted">
        <MonthSelect
          label="Mês de referência"
          value={filters.competence}
          today={todayIso()}
          allLabel="Todos os meses"
          onChange={(value) => onFilterChange("competence", value)}
        />
      </div>
    </div>
  );
}
