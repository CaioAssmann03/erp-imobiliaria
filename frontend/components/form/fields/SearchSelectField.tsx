"use client";

import { useId } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { SearchCombobox } from "@/components/SearchCombobox";
import type { ScopeOption } from "@/components/ScopeSelect";

import { FormField } from "../FormField";
import type { BaseProps } from "./types";
import { useFieldError } from "./use-field-error";

interface SearchSelectFieldProps extends BaseProps {
  options: readonly ScopeOption[];
  placeholder?: string;
  /** Chamado a cada escolha do usuário (não em reset/setValue). */
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  /** O valor do campo quando esvaziado: `""` (o padrão) ou `null`, conforme o schema do formulário. */
  emptyValue?: string | null;
  /** A busca feita fora, para listas grandes demais para trazer inteiras (ver `SearchCombobox`). */
  onSearch?: (query: string) => void;
}

/**
 * O `SelectField` para listas longas (condomínios, pessoas, fornecedores): o campo em si é digitável e abre embaixo uma lista curta de opções
 * (`SearchCombobox`), em vez da lista nativa com todas. Liga o valor ao formulário como o `SelectField`.
 */
export function SearchSelectField({ name, label, required, hint, className, options, placeholder = "Selecione", onValueChange, onSearch, disabled, emptyValue = "" }: SearchSelectFieldProps) {
  const { setValue } = useFormContext();
  const id = useId();
  const error = useFieldError(name);
  const value = (useWatch({ name }) as string | undefined) ?? "";

  return (
    <FormField id={id} label={label} required={required} hint={hint} error={error} className={className}>
      <SearchCombobox
        id={id}
        label={label}
        value={value}
        options={options}
        placeholder={placeholder}
        onSearch={onSearch}
        invalid={Boolean(error)}
        disabled={disabled}
        clearable={!required}
        describedBy={error || hint ? `${id}-message` : undefined}
        onChange={(next) => {
          setValue(name, next === "" ? emptyValue : next, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
          onValueChange?.(next);
        }}
      />
    </FormField>
  );
}
