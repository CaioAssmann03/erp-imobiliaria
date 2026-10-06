"use client";

import { useId } from "react";
import { useFormContext } from "react-hook-form";

import { cn } from "@/lib/utils";

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
      </label>
      <p className="mt-1 min-h-4 text-caption leading-4 text-ink-faint">{hint}</p>
    </div>
  );
}
