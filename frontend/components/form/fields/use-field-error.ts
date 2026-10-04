"use client";

import { get, useFormContext } from "react-hook-form";

/** Mensagem de erro do campo (validação do Zod ou do servidor), se houver. */
export function useFieldError(name: string) {
  const {
    formState: { errors },
  } = useFormContext();
  const error = get(errors, name)?.message;
  return typeof error === "string" ? error : undefined;
}
