import type { FilterGroup } from "@/components/FilterMenu";
import { UNIT_TYPES } from "@/lib/schemas/unit";


/** As pendências de unidade que o painel aponta (`?pending=`). */
export const PENDING_OPTIONS = [
  { value: "without_responsible", label: "Sem responsável" },
  { value: "lease_ending", label: "Locação terminando" },
  { value: "billing_blocked", label: "Lançamento bloqueado" },
];

export interface UnitFilters {
  block: string;
  type: string;
  status: string;
  /** Só vem da URL (atalho das pendências do dashboard); o seletor só aparece quando há uma. */
  pending: string;
}

export const NO_UNIT_FILTERS: UnitFilters = { block: "", type: "", status: "", pending: "" };

/**
 * Os filtros da unidade para o `CompactFilter` (tipo e situação; pendência só quando veio da URL). O bloco não está aqui: é o recorte da lista,
 * num seletor acima da busca (a pílula da coluna da esquerda, ou `UnitBlockSelect` na lista de cadastro).
 */
export function unitFilterGroups(
  filters: UnitFilters,
  onChange: (key: keyof UnitFilters, value: string) => void
): FilterGroup[] {
  return [
    { key: "type", label: "Tipo", value: filters.type, onChange: (value) => onChange("type", value), options: UNIT_TYPES },
    {
      key: "status",
      label: "Situação",
      value: filters.status,
      onChange: (value) => onChange("status", value),
      options: [
        { value: "active", label: "Ativas" },
        { value: "inactive", label: "Inativas" },
      ],
    },
    ...(filters.pending
      ? [
          {
            key: "pending",
            label: "Pendência",
            value: filters.pending,
            onChange: (value: string) => onChange("pending", value),
            options: PENDING_OPTIONS,
          },
        ]
      : []),
  ];
}
