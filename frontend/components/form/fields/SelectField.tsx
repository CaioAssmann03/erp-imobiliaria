"use client";

import { useId } from "react";
import { useFormContext } from "react-hook-form";

import { inputClass } from "@/lib/ui";

import { FormField } from "../FormField";
import type { BaseProps } from "./types";
import { useFieldError } from "./use-field-error";

interface SelectFieldProps extends BaseProps {
  options: readonly { value: string | number; label: string }[];
  placeholder?: string;
  disabled?: boolean;
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
}: SelectFieldProps) {
  const { register } = useFormContext();
  const id = useId();
  const error = useFieldError(name);

  return (
    <FormField id={id} label={label} required={required} hint={hint} error={error} className={className}>
      <select
        id={id}
        className={inputClass}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${id}-message` : undefined}
        aria-required={required}
        disabled={disabled}
        {...register(name)}
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
