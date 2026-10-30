"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { DateField } from "@/components/form/fields";
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
  getBillingDocumentsListQueryKey,
  getBillingDocumentsRetrieveQueryKey,
  useBillingDocumentsReissue,
} from "@/lib/api/generated";
import type { BillingDocument } from "@/lib/api/generated/models";
import { applyServerErrors } from "@/lib/form-errors";
import { addDays, todayIso } from "@/lib/format";
import {
  reissueBillingDocumentSchema,
  type ReissueBillingDocumentFormInput,
  type ReissueBillingDocumentFormOutput,
} from "@/lib/schemas/billing-document";
import { toast } from "@/lib/toast";

/** Reemissão: um novo boleto com o novo vencimento; o antigo é cancelado no gateway e o registro dele fica guardado. */
export function ReissueBillingDocumentDialog({ document }: { document: BillingDocument }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const reissueMutation = useBillingDocumentsReissue();

  const methods = useForm<ReissueBillingDocumentFormInput, unknown, ReissueBillingDocumentFormOutput>({
    resolver: zodResolver(reissueBillingDocumentSchema),
    defaultValues: { due_date: addDays(todayIso(), 3) },
    mode: "onTouched",
  });
  const { handleSubmit, setError } = methods;

  const submit = (values: ReissueBillingDocumentFormOutput) =>
    reissueMutation.mutate(
      { id: document.id, data: { due_date: values.due_date as string } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getBillingDocumentsListQueryKey() });
          toast.success("Boleto reemitido.");
          setOpen(false);
          queryClient.invalidateQueries({ queryKey: getBillingDocumentsRetrieveQueryKey(document.id) });
        },
        onError: (error) => toast.error(applyServerErrors(error, setError)),
      }
    );

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        Reemitir boleto
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reemitir o boleto?</AlertDialogTitle>
            <AlertDialogDescription>
              Será criado um novo boleto para a unidade {document.unit_name} ({document.condominium_name}) com o mesmo valor e
              o vencimento abaixo; o boleto atual é cancelado no gateway e continua guardado no histórico. O pagador recebe o
              novo boleto por e-mail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <FormProvider {...methods}>
            <form noValidate onSubmit={handleSubmit(submit)} className="space-y-3" id={`reissue-${document.id}`}>
              <DateField name="due_date" label="Novo vencimento" required />
            </form>
          </FormProvider>
          <AlertDialogFooter>
            <AlertDialogCancel>Fechar</AlertDialogCancel>
            <Button type="submit" form={`reissue-${document.id}`} disabled={reissueMutation.isPending}>
              {reissueMutation.isPending ? "Reemitindo…" : "Reemitir"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
