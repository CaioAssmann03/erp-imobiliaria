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
  getCondominiumApportionmentCriteriaListQueryKey,
  useCondominiumApportionmentCriteriaCreate,
  useCondominiumApportionmentCriteriaDestroy,
  useCondominiumApportionmentCriteriaList,
  useCondominiumApportionmentCriteriaPartialUpdate,
  useCondominiumsApportionment,
} from "@/lib/api/generated";
import type { CondominiumApportionmentCriterion } from "@/lib/api/generated/models";
import { applyServerErrors, apiErrorMessage } from "@/lib/form-errors";
import { invalidateApportionment } from "@/lib/query/apportionment";
import {
  APPORTIONMENT_CRITERION_DEFAULTS,
  apportionmentCriterionSchema,
  type ApportionmentCriterionFormInput,
  type ApportionmentCriterionFormOutput,
} from "@/lib/schemas/apportionment-criterion";
import { cn } from "@/lib/utils";

const fractionTotal = (value: string) =>
  Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 8, maximumFractionDigits: 8 });

/** A situação da soma das frações de um critério: o que fecha 1 está certo, o que não fecha pede correção, o que ninguém usa fica em cinza. */
function closing(total: { total: string; is_inconsistent: boolean } | undefined) {
  if (!total) return null;
  if (total.is_inconsistent) return { label: "Não fecha 1", tone: "text-danger" };
  if (Number(total.total) === 0) return { label: "Sem uso", tone: "text-ink-faint" };
  return { label: "Fecha 1", tone: "text-success" };
}

/**
 * Os critérios de rateio do condomínio e, na mesma tabela, a soma das frações de cada um entre as unidades ativas (só leitura): cada critério é
 * uma forma de dividir as despesas, com o nome que o condomínio dá ("Geral", "Elevador"...), e um em uso tem que fechar 1. O primeiro é o
 * principal e não pode ser excluído. Como as taxas de juros, são gravados na hora (não dependem do botão Salvar do formulário).
 */
export function ApportionmentCriteriaCard({ condominiumId }: { condominiumId: string }) {
  const queryClient = useQueryClient();
  const { data } = useCondominiumApportionmentCriteriaList({ condominium: condominiumId, limit: 100 });
  const createMutation = useCondominiumApportionmentCriteriaCreate();
  const updateMutation = useCondominiumApportionmentCriteriaPartialUpdate();
  const destroyMutation = useCondominiumApportionmentCriteriaDestroy();
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const criteria = data?.results ?? [];
  const { data: apportionment } = useCondominiumsApportionment(condominiumId);
  const totals = new Map((apportionment?.criteria ?? []).map((item) => [item.criterion, item]));
  const units = apportionment?.active_units;

  const methods = useForm<ApportionmentCriterionFormInput, unknown, ApportionmentCriterionFormOutput>({
    resolver: zodResolver(apportionmentCriterionSchema),
    defaultValues: APPORTIONMENT_CRITERION_DEFAULTS,
    mode: "onTouched",
  });
  const { handleSubmit, reset, setError } = methods;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: getCondominiumApportionmentCriteriaListQueryKey() });
    invalidateApportionment(queryClient);
  };

  const onAdd = (values: ApportionmentCriterionFormOutput) => {
    createMutation.mutate(
      { data: { condominium: condominiumId, name: values.name } as CondominiumApportionmentCriterion },
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

  const remove = (criterion: CondominiumApportionmentCriterion) => {
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
      description={`Formas de dividir as despesas. Um critério em uso precisa somar 1 entre as ${
        units === undefined ? "unidades ativas" : `${units} ${units === 1 ? "unidade ativa" : "unidades ativas"}`
      }; as frações de cada unidade são editadas na própria unidade.`}
    >
      <div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-6 pb-2 text-caption text-ink-faint sm:grid-cols-[minmax(0,1fr)_12rem_9rem]">
          <span>Critério</span>
          <span className="hidden sm:block">Soma das frações</span>
        </div>
        <ul className="divide-y divide-border border-y border-border">
          {criteria.map((criterion) => {
            const state = closing(totals.get(criterion.id));
            const isRenaming = renaming?.id === criterion.id;
            return (
              <li
                key={criterion.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-1 py-3 sm:grid-cols-[minmax(0,1fr)_12rem_9rem]"
              >
                {isRenaming ? (
                  <input
                    aria-label={`Novo nome do critério ${criterion.name}`}
                    className="min-w-0 rounded-control border border-border bg-surface px-3 py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

                <div className="order-last col-span-2 flex items-baseline gap-3 sm:order-none sm:col-span-1">
                  <span className="tabular-nums">{state ? fractionTotal(totals.get(criterion.id)!.total) : "–"}</span>
                  {state && <span className={cn("text-caption font-medium", state.tone)}>{state.label}</span>}
                </div>

                <div className="flex items-center justify-end gap-1">
                  {isRenaming ? (
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
                        className="text-ink-soft hover:text-ink"
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
            );
          })}
        </ul>
      </div>

      <FormProvider {...methods}>
        <div className="flex items-end gap-3" onKeyDown={onEnter(() => void handleSubmit(onAdd)())}>
          <TextField
            name="name"
            label="Novo critério"
            required
            maxLength={100}
            autoComplete="off"
            placeholder="Ex.: Elevador"
            className="min-w-0 flex-1"
          />
          <Button type="button" disabled={createMutation.isPending} onClick={handleSubmit(onAdd)}>
            {createMutation.isPending ? "Adicionando…" : "Adicionar"}
          </Button>
        </div>
      </FormProvider>
    </FormSection>
  );
}
