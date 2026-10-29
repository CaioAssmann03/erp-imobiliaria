"use client";

import { useId } from "react";
import { useFormContext } from "react-hook-form";

import { cn } from "@/lib/utils";

import { FieldHint } from "../FieldHint";
import type { BaseProps } from "./types";

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
        {hint && (
          <span className="ml-auto">
            <FieldHint label={label}>{hint}</FieldHint>
          </span>
        )}
      </label>
      {hint && <p className="sr-only">{hint}</p>}
    </div>
  );
}
