"use client";

import { useId } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { PersonSearchSelect } from "@/components/PersonSearchSelect";
import type { Person } from "@/lib/api/generated/models";

import { FormField } from "../FormField";
import type { BaseProps } from "./types";
import { useFieldError } from "./use-field-error";

interface PersonSelectFieldProps extends BaseProps {
  placeholder?: string;
  /** O valor do campo quando esvaziado: `""` (o padrão) ou `null`, conforme o schema do formulário. */
  emptyValue?: string | null;
  /** Chamado a cada escolha do usuário, com o id (vazio ao limpar) e a pessoa. */
  onValueChange?: (value: string, person: Person | null) => void;
}

/** O campo de formulário para escolher uma pessoa (assessor, pessoa do fornecedor…): ver `PersonSearchSelect`. */
export function PersonSelectField({ name, label, required, hint, className, placeholder, emptyValue = "", onValueChange }: PersonSelectFieldProps) {
  const { setValue } = useFormContext();
  const id = useId();
  const error = useFieldError(name);
  const value = (useWatch({ name }) as string | null | undefined) ?? "";

  return (
    <FormField id={id} label={label} required={required} hint={hint} error={error} className={className}>
      <PersonSearchSelect
        id={id}
        label={label}
        value={value}
        placeholder={placeholder}
        invalid={Boolean(error)}
        describedBy={error || hint ? `${id}-message` : undefined}
        clearable={!required}
        onChange={(next, person) => {
          setValue(name, next === "" ? emptyValue : next, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
          onValueChange?.(next, person);
        }}
      />
    </FormField>
  );
}
