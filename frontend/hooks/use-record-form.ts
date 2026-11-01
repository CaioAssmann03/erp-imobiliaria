"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { type DefaultValues, type FieldValues, useForm } from "react-hook-form";
import type { z } from "zod";

/**
 * O formulário de um cadastro: validação pelo esquema (ao sair do campo) e, quando o registro chega da API na edição, o preenchimento com `toForm`.
 * `toForm` deve ser uma função do módulo (estável), não uma função criada a cada render.
 */
export function useRecordForm<TInput extends FieldValues, TOutput, TRecord>({
  schema,
  defaults,
  record,
  toForm,
}: {
  schema: z.ZodType<TOutput, TInput>;
  defaults: DefaultValues<TInput>;
  /** Na edição, o registro vindo da API e a função que o transforma nos valores do formulário; um formulário só de cadastro não passa nenhum dos dois. */
  record?: TRecord;
  toForm?: (record: TRecord) => TInput;
}) {
  const methods = useForm<TInput, unknown, TOutput>({ resolver: zodResolver(schema), defaultValues: defaults, mode: "onTouched" });
  const { reset } = methods;

  useEffect(() => {
    if (record && toForm) reset(toForm(record));
  }, [record, reset, toForm]);

  return methods;
}
