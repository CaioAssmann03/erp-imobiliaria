"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { DateField, TextField } from "@/components/form/fields";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  getCurrentAccountEntriesListQueryKey,
  getCurrentAccountsListQueryKey,
  useCurrentAccountEntriesReverse,
} from "@/lib/api/generated";
import type { CurrentAccountEntry } from "@/lib/api/generated/models";
import { applyServerErrors } from "@/lib/errors/form-errors";
import { brl, todayIso } from "@/lib/format/format";
import {
  reverseEntrySchema,
  type ReverseEntryFormInput,
  type ReverseEntryFormOutput,
} from "@/lib/schemas/entry-batch";
import { toast } from "@/lib/errors/toast";

/** Estorno: um lançamento nunca é alterado nem apagado, o estorno cria o lançamento oposto. */
export function ReverseEntryDialog({ entry }: { entry: CurrentAccountEntry }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const reverseMutation = useCurrentAccountEntriesReverse();

  const methods = useForm<ReverseEntryFormInput, unknown, ReverseEntryFormOutput>({
    resolver: zodResolver(reverseEntrySchema),
    defaultValues: { reason: "", reversal_date: todayIso() },
    mode: "onTouched",
  });
  const { handleSubmit, setError, reset } = methods;

  const submit = (values: ReverseEntryFormOutput) =>
    reverseMutation.mutate(
      { id: entry.id, data: { reason: values.reason, reversal_date: values.reversal_date as string } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getCurrentAccountEntriesListQueryKey() });
          queryClient.invalidateQueries({ queryKey: getCurrentAccountsListQueryKey() });
          toast.success("Lançamento estornado.");
          reset({ reason: "", reversal_date: todayIso() });
          setOpen(false);
        },
        onError: (error) => toast.error(applyServerErrors(error, setError)),
      }
    );

  return (
    <>
      <Button type="button" variant="ghost" size="sm" className="text-ink-soft hover:text-danger" onClick={() => setOpen(true)}>
        Estornar
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Estornar lançamento {entry.registry}?</AlertDialogTitle>
            <AlertDialogDescription>
              {entry.description} · {entry.kind === "credit" ? "crédito" : "débito"} de {brl(entry.amount)}. Será criado um
              lançamento oposto; o original permanece no extrato.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <FormProvider {...methods}>
            <form noValidate onSubmit={handleSubmit(submit)} className="space-y-3" id={`reverse-${entry.id}`}>
              <DateField name="reversal_date" label="Data do estorno" required />
              <TextField name="reason" label="Motivo" required maxLength={2000} autoComplete="off" />
            </form>
          </FormProvider>
          <AlertDialogFooter>
            <AlertDialogCancel>Fechar</AlertDialogCancel>
            <Button type="submit" form={`reverse-${entry.id}`} variant="destructive" disabled={reverseMutation.isPending}>
              {reverseMutation.isPending ? "Estornando…" : "Estornar"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
