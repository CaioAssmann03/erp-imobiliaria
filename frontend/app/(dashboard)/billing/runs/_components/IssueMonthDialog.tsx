"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { MonthField, SearchSelectField } from "@/components/form/fields";
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
  getBillingRunsListQueryKey,
  useBillingRunsCreate,
  useCondominiumsList,
} from "@/lib/api/generated";
import type { BillingRun } from "@/lib/api/generated/models";
import { applyServerErrors } from "@/lib/errors/form-errors";
import { issuedNothing } from "@/lib/billing/billing-documents";
import { currentMonthTyped, monthFromApi } from "@/lib/billing/billing-plan-payload";
import { billingRunUrl, type BillingRunsScope } from "@/lib/billing/billing-run-workspace";
import { issueMonthSchema, type IssueMonthFormInput, type IssueMonthFormOutput } from "@/lib/schemas/billing-run";
import { toast } from "@/lib/errors/toast";

/** O aviso depois de emitir: sucesso só se emitiu algo; sem emissão nenhuma é um alerta que manda ver os problemas. */
function notifyResult(run: BillingRun) {
  if (run.status === "failed") toast.error("A emissão falhou. Veja o motivo na execução.");
  else if (issuedNothing(run) && run.skipped_count > 0) toast.warning("Nenhum documento foi emitido. Veja os problemas da execução.");
  else if (run.issued_count === 0) toast.info("Todos os documentos do mês já estavam emitidos.");
  else toast.success(run.issued_count === 1 ? "1 documento emitido." : `${run.issued_count} documentos emitidos.`);
}

/**
 * Emite agora o mês de um condomínio (a chamada é síncrona) e abre a execução ao lado da lista. Unidades já emitidas não duplicam. Quem abre é o **+** da lista, que passa
 * o escopo dela: o condomínio e o mês já vêm preenchidos (sem mês na lista, o mês atual).
 */
export function IssueMonthDialog({ open, onOpenChange, scope }: { open: boolean; onOpenChange: (open: boolean) => void; scope: BillingRunsScope }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createMutation = useBillingRunsCreate();
  const { data: condominiums } = useCondominiumsList({ limit: 100 });

  const methods = useForm<IssueMonthFormInput, unknown, IssueMonthFormOutput>({
    resolver: zodResolver(issueMonthSchema),
    defaultValues: { condominium: scope.condominium, reference_month: scope.month ? monthFromApi(scope.month) : currentMonthTyped() },
    mode: "onTouched",
  });
  const { handleSubmit, setError, reset } = methods;

  // A cada abertura o formulário volta a partir do que a lista mostra agora.
  useEffect(() => {
    if (open) reset({ condominium: scope.condominium, reference_month: scope.month ? monthFromApi(scope.month) : currentMonthTyped() });
  }, [open, scope.condominium, scope.month, reset]);

  const submit = (values: IssueMonthFormOutput) =>
    createMutation.mutate(
      { data: values as unknown as BillingRun },
      {
        onSuccess: (run) => {
          queryClient.invalidateQueries({ queryKey: getBillingRunsListQueryKey() });
          queryClient.invalidateQueries({ queryKey: getBillingDocumentsListQueryKey() });
          notifyResult(run);
          onOpenChange(false);
          // A execução nova abre na lista do condomínio dela; o mês da lista só fica se for o dela (senão a execução não apareceria).
          router.push(billingRunUrl(run.id, { condominium: run.condominium, month: scope.month === run.reference_month ? scope.month : "" }));
        },
        onError: (error) => toast.error(applyServerErrors(error, setError)),
      }
    );

  return (
    <>
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Emitir o mês de um condomínio</AlertDialogTitle>
            <AlertDialogDescription>
              Emite o boleto de cada unidade com os planos vigentes no mês. Unidades que já têm documento no mês não são duplicadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <FormProvider {...methods}>
            <form noValidate onSubmit={handleSubmit(submit)} className="space-y-3" id="issue-month">
              <SearchSelectField
                name="condominium"
                label="Condomínio"
                required
                placeholder="Selecione"
                options={(condominiums?.results ?? []).map((item) => ({ value: item.id, label: item.name }))}
              />
              <MonthField
                name="reference_month"
                label="Mês de referência"
                required
                hint="Mês/ano a que a emissão se refere."
              />
            </form>
          </FormProvider>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={createMutation.isPending}>Fechar</AlertDialogCancel>
            <Button type="submit" form="issue-month" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Emitindo…" : "Emitir"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
