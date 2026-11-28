"use client";

import { get, useFormContext } from "react-hook-form";

export function useFieldError(name: string) {
  const {
    formState: { errors },
  } = useFormContext();
  // `get` is typed to answer `unknown` (react-hook-form 7.91): say what an error looks like.
  const error = (get(errors, name) as { message?: unknown } | undefined)?.message;
  return typeof error === "string" ? error : undefined;
}
