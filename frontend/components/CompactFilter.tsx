"use client";

import { Popover } from "@base-ui/react/popover";
import { SlidersHorizontal } from "lucide-react";

import type { FilterGroup } from "@/components/FilterMenu";
import { cn } from "@/lib/utils";

/** `required`: o campo é um escopo (ex.: o condomínio da lista), não um filtro: não tem "Todos" e não conta como filtro ativo. */
export type CompactFilterGroup = FilterGroup & { required?: boolean; /** Com `columns={2}`, ocupa a linha inteira (campos de nome longo). */ wide?: boolean };

const activeGroups = (groups: readonly CompactFilterGroup[]) => groups.filter((group) => group.value && !group.required);

/**
 * Filtros discretos para as listas laterais e de cadastro: só um ícone, que se põe **dentro** do campo de busca (no lugar do botão "Filtros"),
 * com o número de filtros ativos numa bolinha no canto (o ícone em si não muda de cor); o que está ativo se lê ao passar o mouse (não há linha de resumo). Abre um popover pequeno, alinhado à borda direita do botão, com um seletor por filtro.
 * Com `columns={2}` os seletores ficam lado a lado (o popover é mais largo e menos alto; um grupo `wide` ocupa a linha). Um grupo `required` (o condomínio de uma lista de blocos) é só uma
 * escolha de escopo. Para filtros com muitas opções ou mais espaço, use `FilterMenu`.
 */
export function CompactFilter({ groups, onClear, columns = 1 }: { groups: readonly CompactFilterGroup[]; onClear: () => void; columns?: 1 | 2 }) {
  const active = activeGroups(groups);
  const activeCount = active.length;
  // O que está ativo se lê ao passar o mouse no ícone ("Bloco: A · Situação: Ativas"), sem uma linha a mais embaixo da busca.
  const summary = active
    .map((group) => `${group.label}: ${group.options.find((option) => option.value === group.value)?.label ?? group.value}`)
    .join(" · ");

  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label={activeCount > 0 ? `Filtros (${activeCount} ativos): ${summary}` : "Filtros"}
        title={activeCount > 0 ? summary : "Filtros"}
        className={cn(
          "relative flex size-7 shrink-0 items-center justify-center rounded-control text-ink-soft outline-none transition-colors hover:bg-ink/5 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50 data-[popup-open]:bg-ink/5 data-[popup-open]:text-ink"
        )}
      >
        <SlidersHorizontal className="size-4" />
        {activeCount > 0 && (
          <span
            aria-hidden
            className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-brand text-[0.625rem] leading-none font-semibold text-brand-foreground"
          >
            {activeCount}
          </span>
        )}
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={8} className="z-50">
          <Popover.Popup className={cn(columns === 2 ? "w-[min(26rem,92vw)]" : "w-60", "rounded-card bg-surface p-3 shadow-float outline-none transition duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0")}>
            <div className={columns === 2 ? "grid grid-cols-2 gap-3" : "space-y-3"}>
              {groups.map((group) => (
                <label key={group.key} className={cn("block", columns === 2 && group.wide && "col-span-2")}>
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
