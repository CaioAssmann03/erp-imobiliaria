"use client";

import { Popover } from "@base-ui/react/popover";
import { Check, ChevronDown, Search } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

export interface ScopeOption {
  value: string;
  label: string;
  /** O que a variante `segment` mostra no lugar do `label` (o nome, sem o código). */
  title?: string;
}

/** Quantas opções a lista mostra de uma vez: acima disso se digita para achar (o resto não aparece). */
export const SCOPE_SELECT_MAX_RESULTS = 6;

const normalize = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * O seletor de escopo das listas (condomínio, bloco, unidade), que fica **acima da busca**: um botão do tamanho do campo de busca que abre uma
 * lista com um campo para digitar. Digitando se filtra (sem acento nem maiúsculas) e a lista mostra no máximo `SCOPE_SELECT_MAX_RESULTS`
 * opções (sem dizer quantas ficaram de fora: se não achou, digita mais). Setas, Enter e Tab escolhem, Esc fecha. `allLabel` põe uma primeira opção que limpa o escopo
 * (valor vazio), como "Todos os condomínios"; sem ele o escopo é obrigatório e vale `placeholder` enquanto nada foi escolhido.
 * `onCard` é para o seletor dentro de um cartão branco (o fundo do botão muda para não sumir). A variante `segment` é uma metade de uma pílula que junta dois
 * seletores (condomínio e bloco) numa linha só: sem fundo próprio, ocupa a altura da pílula e mostra o nome curto (`title`) da opção.
 */
export function ScopeSelect({
  label,
  value,
  options,
  onChange,
  placeholder = "Selecione",
  allLabel,
  onCard = false,
  variant = "field",
  onSearch,
  className,
}: {
  label: string;
  value: string;
  options: readonly ScopeOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  allLabel?: string;
  onCard?: boolean;
  variant?: "field" | "segment";
  /** Para listas grandes demais para trazer inteiras (pessoas): chamado a cada digitação (e com "" ao fechar); as `options` passam a ser o resultado da busca feita fora e não se filtram aqui. */
  onSearch?: (query: string) => void;
  /** Classes do botão (na variante `segment`, a largura que ele ocupa na pílula). */
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const term = normalize(query.trim());
  const matches = term && !onSearch ? options.filter((option) => normalize(option.label).includes(term)) : options;
  const shown = matches.slice(0, SCOPE_SELECT_MAX_RESULTS);
  // A opção que limpa o escopo vem antes das outras e só some quando se digita.
  const rows: ScopeOption[] = allLabel && !term ? [{ value: "", label: allLabel }, ...shown] : shown;
  const selectedOption = options.find((option) => option.value === value);
  const isSegment = variant === "segment";
  const current = isSegment
    ? (selectedOption ? (selectedOption.title ?? selectedOption.label) : value === "" && allLabel ? allLabel : placeholder)
    : (selectedOption?.label ?? (value === "" && allLabel ? allLabel : placeholder));

  const close = () => {
    setOpen(false);
    setQuery("");
    onSearch?.("");
  };
  const choose = (next: string) => {
    onChange(next);
    close();
  };
  const activeIndex = Math.min(active, Math.max(rows.length - 1, 0));

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((activeIndex + 1) % Math.max(rows.length, 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((activeIndex - 1 + rows.length) % Math.max(rows.length, 1));
    } else if ((event.key === "Enter" || (event.key === "Tab" && !event.shiftKey)) && rows[activeIndex]) {
      event.preventDefault();
      choose(rows[activeIndex].value);
    }
  };

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setOpen(true);
          setActive(0);
        } else close();
      }}
    >
      <Popover.Trigger
        aria-label={`${label}: ${current}`}
        className={cn(
          "flex items-center gap-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/50",
          isSegment
            ? cn("h-full min-w-0 justify-between gap-3 rounded-control px-4 text-body hover:bg-ink/5 data-[popup-open]:bg-ink/5", value === "" && allLabel && "text-ink-soft")
            : cn("h-10 w-full justify-between rounded-control px-3 text-body", onCard ? "bg-surface-muted" : "bg-surface shadow-card"),
          !selectedOption && !(value === "" && allLabel) && "text-ink-faint",
          className
        )}
      >
        <span className="min-w-0 truncate">{current}</span>
        <ChevronDown aria-hidden className="size-4 shrink-0 text-ink-faint" />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner side="bottom" align="start" sideOffset={6} className="z-50">
          <Popover.Popup
            style={{ width: "var(--anchor-width, 20rem)" }}
            className="min-w-60 rounded-card bg-surface p-2 shadow-float outline-none transition duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0"
          >
            <div className="flex h-9 items-center gap-2 rounded-control bg-surface-muted px-3 text-ink-soft focus-within:ring-2 focus-within:ring-brand/50">
              <Search aria-hidden className="size-4 shrink-0" />
              <input
                autoFocus
                type="text"
                role="combobox"
                aria-expanded
                aria-controls="scope-select-options"
                aria-label={`Buscar ${label.toLowerCase()}`}
                autoComplete="off"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  onSearch?.(event.target.value);
                  setActive(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Digite para buscar"
                className="min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-faint"
              />
            </div>

            <ul id="scope-select-options" role="listbox" aria-label={label} className="mt-1.5 space-y-0.5">
              {rows.length === 0 && <li className="px-3 py-2 text-caption text-ink-soft">Nenhum resultado</li>}
              {rows.map((option, index) => {
                const selected = option.value === value;
                return (
                  <li key={option.value || "all"} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      onClick={() => choose(option.value)}
                      onMouseEnter={() => setActive(index)}
                      className={cn(
                        "flex h-9 w-full items-center justify-between gap-2 rounded-control px-3 text-left text-body outline-none transition-colors",
                        index === activeIndex ? "bg-ink/5 text-ink" : "text-ink-soft",
                        selected && "font-medium text-ink"
                      )}
                    >
                      <span className="min-w-0 truncate">{option.label}</span>
                      {selected && <Check aria-hidden className="size-4 shrink-0" />}
                    </button>
                  </li>
                );
              })}
            </ul>

          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
