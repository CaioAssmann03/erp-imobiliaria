"use client";

import { Popover } from "@base-ui/react/popover";
import { useState } from "react";

import { cn } from "@/lib/utils";

export interface FilterGroup {
  key: string;
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
  /** Muitas opções: em vez de botões, mostra um campo de busca com a lista rolável. */
  searchable?: boolean;
}

const normalize = (text: string) =>
  text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/**
 * Seleção única com busca embutida (filtros com muitas opções). Fechado, ocupa uma linha
 * com o valor atual; aberto, mostra o campo de busca e uma lista curta e rolável.
 */
function SearchableOptions({ group }: { group: FilterGroup }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const term = normalize(query.trim());
  const options = term
    ? group.options.filter((option) => normalize(option.label).includes(term))
    : group.options;
  const current = group.options.find((option) => option.value === group.value);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-control bg-ink/5 px-3 text-body outline-none transition-colors hover:bg-ink/10 focus-visible:ring-2 focus-visible:ring-brand/50"
      >
        <span className={cn("truncate", !current && "text-ink-faint")}>{current?.label ?? "Todos"}</span>
        <span aria-hidden className="text-ink-faint">
          {open ? "▴" : "▾"}
        </span>
      </button>

      {open && (
        <div className="mt-1.5 rounded-control bg-ink/5 p-1.5">
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar…"
            aria-label={`Buscar ${group.label.toLowerCase()}`}
            className="mb-1 h-8 w-full rounded-control bg-surface px-2.5 text-body outline-none placeholder:text-ink-faint focus-visible:ring-2 focus-visible:ring-brand/50"
          />
          <div role="listbox" aria-label={group.label} className="max-h-36 overflow-y-auto">
            {options.length === 0 && <p className="px-2.5 py-1.5 text-caption text-ink-soft">Nenhum resultado</p>}
            {options.map((option) => {
              const selected = group.value === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    group.onChange(selected ? "" : option.value);
                    close();
                  }}
                  className={cn(
                    "block w-full truncate rounded-control px-2.5 py-1.5 text-left text-body outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/50",
                    selected ? "font-medium text-ink" : "text-ink-soft hover:bg-ink/5 hover:text-ink"
                  )}
                >
                  {selected ? "✓ " : ""}
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Filtros das listagens: um botão "Filtros" que abre um painel com cada campo e suas
 * opções como botões de escolha (clicar na opção ativa remove o filtro). Os filtros ativos
 * aparecem ao lado como etiquetas removíveis.
 */
export function FilterMenu({ groups, onClear }: { groups: FilterGroup[]; onClear: () => void }) {
  const active = groups.filter((group) => group.value);

  return (
    <>
      <Popover.Root>
        <Popover.Trigger
          className={cn(
            "flex h-9 items-center gap-2 rounded-full bg-surface px-4 text-body font-medium shadow-card outline-none transition-colors hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-brand/50 data-[popup-open]:bg-surface-muted"
          )}
        >
          Filtros
          {active.length > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-ink text-[11px] leading-none text-ink-foreground tabular-nums">
              {active.length}
            </span>
          )}
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Positioner side="bottom" align="start" sideOffset={8} className="z-50">
            <Popover.Popup className="w-[min(20rem,92vw)] glass rounded-card p-4 outline-none transition duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
              <div className="space-y-4">
                {groups.map((group) => (
                  <section key={group.key}>
                    <h3 className="mb-2 text-caption text-ink-soft">{group.label}</h3>
                    {group.searchable ? (
                      <SearchableOptions group={group} />
                    ) : (
                    <div role="radiogroup" aria-label={group.label} className="flex flex-wrap gap-1.5">
                      {group.options.map((option) => {
                        const selected = group.value === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => group.onChange(selected ? "" : option.value)}
                            className={cn(
                              "h-8 rounded-full px-3.5 text-body outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/50",
                              selected
                                ? "bg-ink font-medium text-ink-foreground"
                                : "bg-ink/5 text-ink-soft hover:bg-ink/10 hover:text-ink"
                            )}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                    )}
                  </section>
                ))}
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={onClear}
                  disabled={active.length === 0}
                  className="text-body text-ink-soft transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-40"
                >
                  Limpar filtros
                </button>
              </div>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>

      {active.map((group) => (
        <button
          key={group.key}
          type="button"
          onClick={() => group.onChange("")}
          title="Remover filtro"
          className="group flex h-8 items-center gap-1.5 rounded-full bg-surface-muted px-3 text-caption text-ink outline-none transition-colors hover:bg-surface-sunken focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          <span className="text-ink-soft">{group.label}:</span>
          {group.options.find((option) => option.value === group.value)?.label}
          <span aria-hidden className="text-ink-faint group-hover:text-ink">
            ×
          </span>
        </button>
      ))}
    </>
  );
}
