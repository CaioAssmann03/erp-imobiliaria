"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { TextField } from "@/components/form/fields";
import { FormSection } from "@/components/form/FormSection";
import { Button } from "@/components/ui/button";
import {
  getApportionmentCriteriaListQueryKey,
  useApportionmentCriteriaCreate,
  useApportionmentCriteriaDestroy,
  useApportionmentCriteriaList,
  useApportionmentCriteriaPartialUpdate,
} from "@/lib/api/generated";
import type { ApportionmentCriterion } from "@/lib/api/generated/models";
import { applyServerErrors, apiErrorMessage } from "@/lib/form-errors";
import { invalidateApportionment } from "@/lib/query/apportionment";
import {
  APPORTIONMENT_CRITERION_DEFAULTS,
  apportionmentCriterionSchema,
  type ApportionmentCriterionFormInput,
  type ApportionmentCriterionFormOutput,
} from "@/lib/schemas/apportionment-criterion";

/**
 * Os critérios de rateio do condomínio: cada um é uma forma de dividir as despesas, com o nome que o
 * condomínio dá ("Geral", "Elevador"...). O primeiro é o principal e não pode ser excluído. Como as
 * taxas de juros, são gravados na hora (não dependem do botão Salvar do formulário).
 */
export function ApportionmentCriteriaCard({ condominiumId }: { condominiumId: string }) {
  const queryClient = useQueryClient();
  const { data } = useApportionmentCriteriaList({ condominium: condominiumId, limit: 100 });
  const createMutation = useApportionmentCriteriaCreate();
  const updateMutation = useApportionmentCriteriaPartialUpdate();
  const destroyMutation = useApportionmentCriteriaDestroy();
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const criteria = data?.results ?? [];

  const methods = useForm<ApportionmentCriterionFormInput, unknown, ApportionmentCriterionFormOutput>({
    resolver: zodResolver(apportionmentCriterionSchema),
    defaultValues: APPORTIONMENT_CRITERION_DEFAULTS,
    mode: "onTouched",
  });
  const { handleSubmit, reset, setError } = methods;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: getApportionmentCriteriaListQueryKey() });
    invalidateApportionment(queryClient);
  };

  const onAdd = (values: ApportionmentCriterionFormOutput) => {
    createMutation.mutate(
      { data: { condominium: condominiumId, name: values.name } as ApportionmentCriterion },
      {
        onSuccess: () => {
          reset();
          refresh();
          toast.success("Critério adicionado.");
        },
        onError: (error) => toast.error(applyServerErrors(error, setError)),
      }
    );
  };

  const saveRename = () => {
    if (!renaming) return;
    updateMutation.mutate(
      { id: renaming.id, data: { name: renaming.name.trim() } },
      {
        onSuccess: () => {
          setRenaming(null);
          refresh();
          toast.success("Critério renomeado.");
        },
        onError: (error) => toast.error(apiErrorMessage(error, "Não foi possível renomear o critério.")),
      }
    );
  };

  const remove = (criterion: ApportionmentCriterion) => {
    destroyMutation.mutate(
      { id: criterion.id },
      {
        onSuccess: () => {
          refresh();
          toast.success("Critério removido.");
        },
        onError: (error) => toast.error(apiErrorMessage(error, "Não foi possível remover o critério.")),
      }
    );
  };

  /** Está dentro do formulário do condomínio: o Enter age sobre o critério em vez de salvar o condomínio. */
  const onEnter = (action: () => void) => (event: React.KeyboardEvent) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    action();
  };

  return (
    <FormSection
      title="Critérios de rateio"
      description="Formas de dividir as despesas do condomínio. Cada unidade tem uma fração em cada critério, editada na própria unidade. O principal não pode ser excluído."
    >
      <ul className="space-y-1">
        {criteria.map((criterion) => (
          <li
            key={criterion.id}
            className="flex items-center justify-between gap-2 rounded-panel bg-surface-muted px-4 py-2.5"
          >
            {renaming?.id === criterion.id ? (
              <input
                aria-label={`Novo nome do critério ${criterion.name}`}
                className="min-w-0 flex-1 rounded-panel border border-border bg-surface px-3 py-1.5"
                value={renaming.name}
                maxLength={100}
                autoFocus
                onChange={(event) => setRenaming({ id: criterion.id, name: event.target.value })}
                onKeyDown={onEnter(saveRename)}
              />
            ) : (
              <div className="min-w-0">
                <div className="truncate font-medium">{criterion.name}</div>
                {criterion.position === 1 && <div className="text-caption text-ink-soft">Principal</div>}
              </div>
            )}
            <div className="flex shrink-0 items-center gap-1">
              {renaming?.id === criterion.id ? (
                <>
                  <Button type="button" size="sm" disabled={updateMutation.isPending} onClick={saveRename}>
                    Salvar
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setRenaming(null)}>
                    Cancelar
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setRenaming({ id: criterion.id, name: criterion.name })}
                  >
                    Renomear
                  </Button>
                  {criterion.position !== 1 && (
                    <ConfirmDeleteButton
                      label="Remover"
                      title="Remover critério de rateio?"
                      description={`O critério "${criterion.name}" deixará de existir. Só é possível remover um critério que nenhuma unidade nem item de plano usa.`}
                      onConfirm={() => remove(criterion)}
                    />
                  )}
                </>
              )}
            </div>
          </li>
        ))}
      </ul>

      <FormProvider {...methods}>
        <div
          className="space-y-3 rounded-panel border border-border p-4"
          onKeyDown={onEnter(() => void handleSubmit(onAdd)())}
        >
          <p className="mb-2 text-body font-medium">Adicionar critério</p>
          <TextField name="name" label="Nome" required maxLength={100} autoComplete="off" placeholder="Ex.: Elevador" />
          <div className="flex justify-end pt-1">
            <Button type="button" disabled={createMutation.isPending} onClick={handleSubmit(onAdd)}>
              {createMutation.isPending ? "Adicionando…" : "Adicionar critério"}
            </Button>
          </div>
        </div>
      </FormProvider>
    </FormSection>
  );
}
