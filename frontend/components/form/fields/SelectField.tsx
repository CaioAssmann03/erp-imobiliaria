"use client";

import { useId } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { inputClass } from "@/lib/ui";

import { FormField } from "../FormField";
import type { BaseProps } from "./types";
import { useFieldError } from "./use-field-error";

interface SelectFieldProps extends BaseProps {
  options: readonly { value: string | number; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  /** Chamado a cada escolha do usuário (não em reset/setValue). */
  onValueChange?: (value: string) => void;
}

export function SelectField({
  name,
  label,
  required,
  hint,
  className,
  options,
  placeholder,
  disabled,
  onValueChange,
}: SelectFieldProps) {
  const { register } = useFormContext();
  const id = useId();
  const error = useFieldError(name);
  const field = register(name);
  // Controlled on purpose: the options usually load after the form was filled (`reset`), and an
  // uncontrolled native select only shows a value whose <option> already exists. A controlled one
  // re-applies `value` each time the options change, so the stored choice appears once they arrive.
  const value = useWatch({ name }) as string | number | undefined;

  return (
    <FormField id={id} label={label} required={required} hint={hint} error={error} className={className}>
      <select
        id={id}
        className={inputClass}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${id}-message` : undefined}
        aria-required={required}
        disabled={disabled}
        {...field}
        value={value ?? ""}
        onChange={(event) => {
          field.onChange(event);
          onValueChange?.(event.target.value);
        }}
      >
        {placeholder !== undefined && (
          <option value="">{placeholder}</option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}
