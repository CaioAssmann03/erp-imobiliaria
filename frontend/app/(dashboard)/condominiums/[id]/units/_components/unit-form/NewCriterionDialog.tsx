"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { TextField } from "@/components/form/fields";
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
  getCondominiumApportionmentCriteriaListQueryKey,
  useCondominiumApportionmentCriteriaCreate,
  useCondominiumApportionmentCriteriaList,
  useCondominiumsRetrieve,
} from "@/lib/api/generated";
import type { CondominiumApportionmentCriterion } from "@/lib/api/generated/models";
import { formatCode } from "@/lib/billing-entry-payload";
import { applyServerErrors } from "@/lib/form-errors";
import { invalidateApportionment } from "@/lib/query/apportionment";
import {
  APPORTIONMENT_CRITERION_DEFAULTS,
  apportionmentCriterionSchema,
  type ApportionmentCriterionFormInput,
  type ApportionmentCriterionFormOutput,
} from "@/lib/schemas/apportionment-criterion";
import { toast } from "@/lib/toast";

/**
 * O "+" das frações ideais da unidade: cria um critério de rateio sem sair da unidade. O critério é sempre do condomínio desta unidade (por isso ele vem
 * preenchido e não se troca) e só tem o nome; a posição é dada pela API. Mostra os critérios que o condomínio já tem, para não repetir um. Ao salvar,
 * o campo da fração do critério novo já aparece na seção.
 */
export function NewCriterionDialog({ condominiumId }: { condominiumId: string }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const createMutation = useCondominiumApportionmentCriteriaCreate();
  const { data: condominium } = useCondominiumsRetrieve(condominiumId, { query: { enabled: open } });
  const { data: criteria } = useCondominiumApportionmentCriteriaList({ condominium: condominiumId, limit: 100 }, { query: { enabled: open } });

  const methods = useForm<ApportionmentCriterionFormInput, unknown, ApportionmentCriterionFormOutput>({
    resolver: zodResolver(apportionmentCriterionSchema),
    defaultValues: APPORTIONMENT_CRITERION_DEFAULTS,
    mode: "onTouched",
  });
  const { handleSubmit, reset, setError } = methods;

  const close = (next: boolean) => {
    setOpen(next);
    if (!next) reset(APPORTIONMENT_CRITERION_DEFAULTS);
  };

  const submit = (values: ApportionmentCriterionFormOutput) =>
    createMutation.mutate(
      { data: { condominium: condominiumId, name: values.name } as CondominiumApportionmentCriterion },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: getCondominiumApportionmentCriteriaListQueryKey() });
          void invalidateApportionment(queryClient);
          toast.success("Critério de rateio adicionado.");
          close(false);
        },
        onError: (error) => toast.error(applyServerErrors(error, setError)),
      }
    );

  return (
    <>
      <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Novo critério de rateio
      </Button>
      <AlertDialog open={open} onOpenChange={close}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Novo critério de rateio</AlertDialogTitle>
            <AlertDialogDescription>Uma forma de dividir as despesas deste condomínio, como &quot;Elevador&quot;. Depois, preencha a fração da unidade nele.</AlertDialogDescription>
          </AlertDialogHeader>
          <FormProvider {...methods}>
            <form
              noValidate
              id="new-criterion"
              // O diálogo é aberto de dentro da página da unidade (na árvore do React): sem isto o envio subiria para o formulário dela.
              onSubmit={(event) => {
                event.stopPropagation();
                void handleSubmit(submit)(event);
              }}
              className="space-y-4"
            >
              <div className="flex flex-col">
                <span className="mb-1.5 text-caption font-medium text-ink-soft">Condomínio</span>
                <p className="flex h-9 items-center truncate rounded-control bg-surface-muted px-3 text-body">
                  {condominium ? `${formatCode(condominium.code)} · ${condominium.name}` : "…"}
                </p>
              </div>
              <TextField name="name" label="Nome do critério" required maxLength={100} autoComplete="off" placeholder="Ex.: Elevador" />
              {criteria && criteria.results.length > 0 && (
                <p className="text-caption text-ink-soft">Já existem: {criteria.results.map((criterion) => criterion.name).join(", ")}.</p>
              )}
            </form>
          </FormProvider>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button type="submit" form="new-criterion" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Adicionando…" : "Adicionar critério"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
