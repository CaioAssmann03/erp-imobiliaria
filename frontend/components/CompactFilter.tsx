"use client";

import { Popover } from "@base-ui/react/popover";
import { SlidersHorizontal } from "lucide-react";

import type { FilterGroup } from "@/components/FilterMenu";

/** `required`: o campo é um escopo (ex.: o condomínio da lista), não um filtro: não tem "Todos" e não conta como filtro ativo. */
export type CompactFilterGroup = FilterGroup & { required?: boolean };

const activeGroups = (groups: readonly CompactFilterGroup[]) => groups.filter((group) => group.value && !group.required);

/**
 * Filtros discretos para as listas laterais e de cadastro: só um ícone, que se põe **dentro** do campo de busca (no lugar do botão "Filtros"),
 * com um ponto quando há filtro ativo. Abre um popover pequeno, alinhado à borda direita do botão, com um seletor por filtro.
 * O que está ativo se lê em `FilterSummary`, numa linha só, abaixo da busca. Um grupo `required` (o condomínio de uma lista de blocos) é só uma
 * escolha de escopo. Para filtros com muitas opções ou mais espaço, use `FilterMenu`.
 */
export function CompactFilter({ groups, onClear }: { groups: readonly CompactFilterGroup[]; onClear: () => void }) {
  const activeCount = activeGroups(groups).length;

  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label={activeCount > 0 ? `Filtros (${activeCount} ativos)` : "Filtros"}
        title="Filtros"
        className="relative flex size-7 shrink-0 items-center justify-center rounded-control text-ink-soft outline-none transition-colors hover:bg-ink/5 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50 data-[popup-open]:bg-ink/5 data-[popup-open]:text-ink"
      >
        <SlidersHorizontal className="size-4" />
        {activeCount > 0 && <span aria-hidden className="absolute top-0.5 right-0.5 size-2 rounded-full bg-brand" />}
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={8} className="z-50">
          <Popover.Popup className="w-60 rounded-card bg-surface p-3 shadow-float outline-none transition duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            <div className="space-y-3">
              {groups.map((group) => (
                <label key={group.key} className="block">
                  <span className="mb-1 block text-caption text-ink-soft">{group.label}</span>
                  <select
                    value={group.value}
                    onChange={(event) => group.onChange(event.target.value)}
                    className="h-9 w-full rounded-control bg-surface-muted px-2.5 text-body outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                  >
                    {!group.required && <option value="">Todos</option>}
                    {group.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={onClear}
                className="mt-3 text-caption text-ink-soft underline-offset-2 transition-colors hover:text-ink hover:underline"
              >
                Limpar filtros
              </button>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

/** Os filtros ativos numa linha só ("Bloco: A · Status: Ativas") com **Limpar**; some quando não há nenhum. */
export function FilterSummary({ groups, onClear }: { groups: readonly CompactFilterGroup[]; onClear: () => void }) {
  const active = activeGroups(groups);
  if (active.length === 0) return null;

  const text = active
    .map((group) => `${group.label}: ${group.options.find((option) => option.value === group.value)?.label ?? group.value}`)
    .join(" · ");

  return (
    <div className="flex items-center justify-between gap-2 px-1 text-caption text-ink-soft">
      <span className="min-w-0 truncate">{text}</span>
      <button
        type="button"
        onClick={onClear}
        className="shrink-0 font-medium text-ink underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
      >
        Limpar
      </button>
    </div>
  );
}
