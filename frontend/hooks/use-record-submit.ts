"use client";

import { type QueryKey, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { FieldValues, UseFormSetError } from "react-hook-form";

import { applyServerErrors } from "@/lib/errors/form-errors";
import { toast } from "@/lib/errors/toast";

/** O que o hook precisa de uma mutação do Orval: chamar com as variáveis e as opções, e saber se está em andamento. */
interface Mutation<TVariables, TRecord> {
  mutate: (variables: TVariables, options: { onSuccess: (data: TRecord) => void; onError: (error: unknown) => void }) => void;
  isPending: boolean;
}

/**
 * O salvar de um cadastro, o mesmo em todo módulo: manda o formulário para a API (cria quando não há `recordId`, atualiza quando há), atualiza as listas,
 * avisa e leva para onde o módulo disse. Erros do servidor viram erros dos campos (`setError`, com `errorPath` quando o caminho da API não é o nome do campo)
 * e a mensagem geral vai ao aviso.
 *
 * Cada módulo passa só o que é seu: `toPayload`, as mutações `create`/`update` (com `{ data }` e `{ id, data }`; se a criação leva algo a mais, como `params`,
 * o módulo embrulha a mutação), as `invalidate` chaves a atualizar para o registro salvo, as `messages` e `redirect`. Sem `redirect` (ou se ele devolve
 * `undefined`) fica na página: é o que acontece ao salvar uma edição, e a lista ao lado já mostra o que mudou.
 */
export function useRecordSubmit<TInput extends FieldValues, TValues, TRecord extends { id: string }>({
  recordId,
  setError,
  errorPath,
  toPayload,
  create,
  update,
  invalidate,
  messages,
  redirect,
}: {
  recordId: string | undefined;
  setError: UseFormSetError<TInput>;
  errorPath?: (path: string) => string;
  toPayload: (values: TValues, isEdit: boolean) => object;
  create: Mutation<{ data: TRecord }, TRecord>;
  update: Mutation<{ id: string; data: Partial<TRecord> }, TRecord>;
  invalidate: (id: string) => readonly QueryKey[];
  messages: { updated: string; created: string };
  redirect?: (saved: TRecord, created: boolean) => string | undefined;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const done = (message: string, id: string, saved: TRecord, created: boolean) => {
    for (const queryKey of invalidate(id)) queryClient.invalidateQueries({ queryKey });
    toast.success(message);
    const url = redirect?.(saved, created);
    if (url) router.push(url);
  };
  const onError = (error: unknown) => toast.error(applyServerErrors(error, setError, errorPath));

  const submit = (values: TValues) => {
    const payload = toPayload(values, recordId !== undefined);
    if (recordId !== undefined) {
      update.mutate({ id: recordId, data: payload as Partial<TRecord> }, { onSuccess: (saved) => done(messages.updated, recordId, saved, false), onError });
    } else {
      create.mutate({ data: payload as unknown as TRecord }, { onSuccess: (saved) => done(messages.created, saved.id, saved, true), onError });
    }
  };

  return { submit, isSubmitting: create.isPending || update.isPending };
}
