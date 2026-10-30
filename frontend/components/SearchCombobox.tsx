"use client";

import { Combobox } from "@base-ui/react/combobox";
import { Check, ChevronDown, X } from "lucide-react";
import { useRef, useState } from "react";

import { SCOPE_SELECT_MAX_RESULTS, type ScopeOption } from "@/components/ScopeSelect";
import { inputClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

const normalize = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const digitsOf = (text: string) => text.replace(/\D/g, "");

/** A primeira opção que o texto digitado descreve (pelo nome ou, se há números, pelos dígitos do código ou do documento), ou nenhuma. */
function firstMatch(options: readonly ScopeOption[], text: string): ScopeOption | undefined {
  const term = normalize(text);
  const digits = digitsOf(text);
  return options.find((option) => normalize(option.label).includes(term) || (digits !== "" && digitsOf(option.label).includes(digits)));
}

/**
 * O campo de formulário com busca: o **próprio campo é onde se digita** (como um campo de texto), e embaixo abre a lista com no máximo
 * `SCOPE_SELECT_MAX_RESULTS` opções. Digitando se filtra (sem acento nem maiúsculas); setas e Enter escolhem, Esc fecha, e **Tab completa** com a primeira opção que o texto descreve (digitar `001` e apertar Tab escolhe o 0001). Para listas grandes demais para trazer
 * inteiras (pessoas, fornecedores) passe `onSearch`: a busca é feita fora, `options` passam a ser o resultado dela e não se filtram aqui. A opção
 * escolhida continua valendo mesmo quando uma busca seguinte não a traz.
 */
export function SearchCombobox({
  id,
  label,
  value,
  options,
  onChange,
  placeholder,
  onSearch,
  invalid,
  describedBy,
  disabled,
  clearable,
  className,
}: {
  id?: string;
  label: string;
  value: string;
  options: readonly ScopeOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  onSearch?: (query: string) => void;
  invalid?: boolean;
  describedBy?: string;
  disabled?: boolean;
  /** Um campo opcional com valor ganha o "x" que o esvazia (num obrigatório a escolha só troca por outra). */
  clearable?: boolean;
  className?: string;
}) {
  // A última opção escolhida aqui, para o campo continuar mostrando o nome dela se a busca seguinte não a trouxer.
  const [picked, setPicked] = useState<ScopeOption | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = options.find((option) => option.value === value) ?? (picked?.value === value ? picked : null);
  const items = selected && !options.some((option) => option.value === selected.value) ? [selected, ...options] : [...options];

  return (
    <Combobox.Root
      items={items}
      value={selected}
      limit={SCOPE_SELECT_MAX_RESULTS}
      autoHighlight
      disabled={disabled}
      isItemEqualToValue={(item, current) => item.value === current.value}
      itemToStringLabel={(item) => item.label}
      // Busca feita fora: a lista mostra o que veio, sem filtrar de novo.
      {...(onSearch ? { filter: null } : {})}
      onValueChange={(item) => {
        setPicked(item);
        onChange(item?.value ?? "");
      }}
      onInputValueChange={(text, details) => {
        // Só o que a pessoa digita (ou apaga) vira busca: o campo preencher-se com o nome da opção escolhida não é uma busca.
        if (onSearch && (details.reason === "input-change" || details.reason === "input-clear")) onSearch(text);
      }}
      onOpenChange={(open) => {
        if (!open) onSearch?.("");
      }}
    >
      <div className={cn("relative", className)}>
        <Combobox.Input
          id={id}
          aria-label={label}
          aria-invalid={invalid ? true : undefined}
          aria-describedby={describedBy}
          placeholder={placeholder}
          autoComplete="off"
          ref={inputRef}
          onKeyDown={(event) => {
            // Tab completa o que foi digitado com a primeira opção que ele descreve (e segue para o próximo campo); texto que já é a opção escolhida não muda nada.
            if (event.key !== "Tab" || event.shiftKey) return;
            const text = inputRef.current?.value ?? "";
            if (text.trim() === "" || text === selected?.label) return;
            const match = firstMatch(items, text);
            if (match) {
              setPicked(match);
              onChange(match.value);
            }
          }}
          className={cn(inputClass, clearable && selected ? "pr-16" : "pr-9")}
        />
        {clearable && selected && !disabled && (
          <Combobox.Clear
            aria-label={`Limpar: ${label}`}
            className="absolute inset-y-0 right-8 flex w-7 items-center justify-center text-ink-faint outline-none transition-colors hover:text-ink focus-visible:text-ink"
          >
            <X aria-hidden className="size-3.5" />
          </Combobox.Clear>
        )}
        <Combobox.Trigger
          aria-label={`Abrir a lista: ${label}`}
          className="absolute inset-y-0 right-0 flex w-9 items-center justify-center rounded-r-control text-ink-faint outline-none transition-colors hover:text-ink focus-visible:text-ink"
        >
          <ChevronDown aria-hidden className="size-4" />
        </Combobox.Trigger>
      </div>

      <Combobox.Portal>
        <Combobox.Positioner sideOffset={6} className="z-50 outline-none">
          <Combobox.Popup className="w-[var(--anchor-width)] max-w-[var(--available-width)] origin-[var(--transform-origin)] rounded-card bg-surface p-2 shadow-float outline-none transition duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            <Combobox.Empty>
              <p className="px-3 py-2 text-caption text-ink-soft">Nenhum resultado</p>
            </Combobox.Empty>
            <Combobox.List className="space-y-0.5 outline-none">
              {(option: ScopeOption) => (
                <Combobox.Item
                  key={option.value}
                  value={option}
                  className="flex h-9 cursor-default items-center justify-between gap-2 rounded-control px-3 text-body text-ink-soft outline-none select-none data-[highlighted]:bg-ink/5 data-[highlighted]:text-ink data-[selected]:font-medium data-[selected]:text-ink"
                >
                  <span className="min-w-0 truncate">{option.label}</span>
                  <Combobox.ItemIndicator>
                    <Check aria-hidden className="size-4 shrink-0" />
                  </Combobox.ItemIndicator>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
