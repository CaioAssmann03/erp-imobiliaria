"use client";

import { useId } from "react";
import { get, useFormContext } from "react-hook-form";

import { cn } from "@/lib/utils";
import { inputClass } from "@/lib/ui";

import { FormField } from "./FormField";

function useFieldError(name: string) {
  const {
    formState: { errors },
  } = useFormContext();
  const error = get(errors, name)?.message;
  return typeof error === "string" ? error : undefined;
}

interface BaseProps {
  name: string;
  label: string;
  required?: boolean;
  hint?: string;
  className?: string;
}

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

interface SelectFieldProps extends BaseProps {
  options: readonly { value: string | number; label: string }[];
  placeholder?: string;
}

export function SelectField({
  name,
  label,
  required,
  hint,
  className,
  options,
  placeholder,
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

export function CheckboxField({
  name,
  label,
  hint,
  className,
}: Omit<BaseProps, "required">) {
  const { register } = useFormContext();
  const id = useId();

  return (
    <div className={cn("flex flex-col justify-end", className)}>
      <label
        htmlFor={id}
        className="flex h-9 cursor-pointer items-center gap-2.5 rounded-control bg-surface-muted px-3 text-body transition-colors hover:bg-surface-sunken"
      >
        <input
          id={id}
          type="checkbox"
          className="size-4 cursor-pointer accent-brand"
          {...register(name)}
        />
        {label}
      </label>
      <p className="mt-1 min-h-4 text-caption leading-4 text-ink-faint">{hint}</p>
    </div>
  );
}
