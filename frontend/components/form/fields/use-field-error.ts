"use client";

import { get, useFormContext } from "react-hook-form";

export function useFieldError(name: string) {
  const {
    formState: { errors },
  } = useFormContext();
  const error = get(errors, name)?.message;
  return typeof error === "string" ? error : undefined;
}
