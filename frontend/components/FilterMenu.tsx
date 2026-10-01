"use client";

import { Popover } from "@base-ui/react/popover";

import { cn } from "@/lib/utils";

export interface FilterGroup {
  key: string;
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
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
            <Popover.Popup className="w-[min(22rem,92vw)] rounded-card bg-surface p-5 shadow-float outline-none transition duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
              <div className="space-y-5">
                {groups.map((group) => (
                  <section key={group.key}>
                    <h3 className="mb-2 text-caption text-ink-soft">{group.label}</h3>
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
                                : "bg-surface-muted text-ink-soft hover:text-ink"
                            )}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
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
