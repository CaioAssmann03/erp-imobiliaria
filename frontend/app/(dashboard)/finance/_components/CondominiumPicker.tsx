"use client";

import { Popover } from "@base-ui/react/popover";
import { Building2, Check, ChevronDown } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

interface CondominiumPickerProps {
  /** O condomínio escolhido (`""` = nenhum ainda). */
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
}

const normalize = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * O condomínio do extrato, sempre à vista no topo da página (não escondido nos filtros): um botão com o nome escolhido
 * que abre uma lista com busca. Trocar de condomínio troca o extrato inteiro.
 */
export function CondominiumPicker({ value, onChange, options }: CondominiumPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const term = normalize(query.trim());
  const visible = term ? options.filter((option) => normalize(option.label).includes(term)) : options;
  const current = options.find((option) => option.value === value);

  const choose = (next: string) => {
    onChange(next);
    setOpen(false);
    setQuery("");
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        aria-label="Escolher o condomínio do extrato"
        className="flex h-11 w-full items-center gap-2.5 rounded-control bg-ink/5 px-3 text-left ring-1 ring-ink/10 outline-none transition-colors hover:bg-ink/10 focus-visible:ring-2 focus-visible:ring-brand/50 data-[popup-open]:bg-ink/10"
      >
        <Building2 className="size-4 shrink-0 text-ink-soft" />
        <span className={cn("min-w-0 flex-1 truncate text-body font-medium", !current && "font-normal text-ink-faint")}>
          {current?.label ?? "Escolher condomínio"}
        </span>
        <ChevronDown className="size-4 shrink-0 text-ink-soft" />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner side="bottom" align="start" sideOffset={8} className="z-50">
          <Popover.Popup className="w-[min(22rem,92vw)] glass rounded-card p-3 outline-none transition duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar condomínio…"
              aria-label="Buscar condomínio"
              className="mb-2 h-10 w-full rounded-control bg-surface px-3 text-body outline-none placeholder:text-ink-faint focus-visible:ring-2 focus-visible:ring-brand/50"
            />
            <div role="listbox" aria-label="Condomínios" className="max-h-64 overflow-y-auto">
              {visible.length === 0 && <p className="px-3 py-2 text-caption text-ink-soft">Nenhum condomínio encontrado</p>}
              {visible.map((option) => {
                const selected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => choose(option.value)}
                    className={cn(
                      "flex min-h-10 w-full items-center gap-2 rounded-control px-3 text-left text-body outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/50",
                      selected ? "bg-ink/5 font-medium text-ink" : "text-ink-soft hover:bg-ink/5 hover:text-ink"
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                    {selected && <Check className="size-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
