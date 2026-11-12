"use client";

import { useId } from "react";
import { useFormContext } from "react-hook-form";

import { inputClass } from "@/lib/theme/ui";

import { FormField } from "../FormField";
import type { BaseProps } from "./types";
import { useFieldError } from "./use-field-error";

interface TextFieldProps
  extends BaseProps,
    Omit<React.ComponentProps<"input">, "name" | "className" | "required"> {
  /** Máscara aplicada enquanto o usuário digita. */
  mask?: (value: string) => string;
  /** Chamado a cada edição do usuário (não em reset/setValue), com o valor já mascarado. */
  onValueChange?: (value: string) => void;
  /** Sugestões (datalist) sem restringir o valor. */
  suggestions?: string[];
}

export function TextField({
  name,
  label,
  required,
  hint,
  className,
  mask,
  onValueChange,
  suggestions,
  ...props
}: TextFieldProps) {
  const { register } = useFormContext();
  const id = useId();
  const error = useFieldError(name);
  const field = register(name);

  return (
    <FormField id={id} label={label} required={required} hint={hint} error={error} className={className}>
      <input
        id={id}
        className={inputClass}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${id}-message` : undefined}
        aria-required={required}
        list={suggestions ? `${id}-list` : undefined}
        {...props}
        {...field}
        onChange={(event) => {
          if (mask) event.target.value = mask(event.target.value);
          field.onChange(event);
          onValueChange?.(event.target.value);
        }}
      />
      {suggestions && (
        <datalist id={`${id}-list`}>
          {suggestions.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      )}
    </FormField>
  );
}
