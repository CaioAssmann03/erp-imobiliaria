"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { TextField } from "@/components/form/fields";
import { FieldRow } from "@/components/form/FormSection";
import { Button } from "@/components/ui/button";
import {
  getLateInterestRatesListQueryKey,
  useLateInterestRatesCreate,
  useLateInterestRatesDestroy,
  useLateInterestRatesList,
} from "@/lib/api/generated";
import type { LateInterestRate } from "@/lib/api/generated/models";
import { applyServerErrors } from "@/lib/form-errors";
import { formatDate } from "@/lib/format";
import { maskDecimal } from "@/lib/masks";
import {
  LATE_INTEREST_RATE_DEFAULTS,
  lateInterestRateSchema,
  type LateInterestRateFormInput,
  type LateInterestRateFormOutput,
} from "@/lib/schemas/late-interest-rate";

const percent = (value: string) => maskDecimal(value, 2, 3);
const percentLabel = (value: string) =>
  `${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

/**
 * As taxas de juros do condomínio: cada uma vale a partir da sua data de início. Como as unidades de
 * uma pessoa, são gravadas na hora (não dependem do botão Salvar do formulário), então só existem
 * depois que o condomínio foi cadastrado.
 */
export function InterestRatesCard({ condominiumId }: { condominiumId?: string }) {
  if (condominiumId === undefined) {
    return (
      <p className="rounded-panel bg-surface-muted px-4 py-2.5 text-body text-ink-soft">
        Salve o condomínio para cadastrar as taxas de juros.
      </p>
    );
  }
  return <InterestRates condominiumId={condominiumId} />;
}

function InterestRates({ condominiumId }: { condominiumId: string }) {
  const queryClient = useQueryClient();
  const { data } = useLateInterestRatesList({ condominium: condominiumId, limit: 100 });
  const createMutation = useLateInterestRatesCreate();
  const destroyMutation = useLateInterestRatesDestroy();
  const rates = data?.results ?? [];

  const methods = useForm<LateInterestRateFormInput, unknown, LateInterestRateFormOutput>({
    resolver: zodResolver(lateInterestRateSchema),
    defaultValues: LATE_INTEREST_RATE_DEFAULTS,
    mode: "onTouched",
  });
  const { handleSubmit, reset, setError } = methods;

  const refresh = () => queryClient.invalidateQueries({ queryKey: getLateInterestRatesListQueryKey() });

  const onSubmit = (values: LateInterestRateFormOutput) => {
    createMutation.mutate(
      {
        data: {
          condominium: condominiumId,
          start_date: values.start_date!,
          monthly_percentage: values.monthly_percentage!,
        } as LateInterestRate,
      },
      {
        onSuccess: () => {
          reset();
          refresh();
          toast.success("Taxa de juros adicionada.");
        },
        onError: (error) => toast.error(applyServerErrors(error, setError)),
      }
    );
  };

  const handleRemove = (rateId: string) => {
    destroyMutation.mutate(
      { id: rateId },
      {
        onSuccess: () => {
          refresh();
          toast.success("Taxa de juros removida.");
        },
        onError: () => toast.error("Não foi possível remover a taxa."),
      }
    );
  };

  return (
    <div className="space-y-3">
      {rates.length === 0 ? (
        <p className="text-body text-ink-soft">Nenhuma taxa cadastrada: este condomínio não cobra juros.</p>
      ) : (
        <ul className="space-y-1">
          {rates.map((rate) => (
            <li
              key={rate.id}
              className="flex items-center justify-between rounded-panel bg-surface-muted px-4 py-2.5"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">A partir de {formatDate(rate.start_date)}</div>
                <div className="text-caption text-ink-soft">{percentLabel(rate.monthly_percentage)} ao mês</div>
              </div>
              <ConfirmDeleteButton
                label="Remover"
                title="Remover taxa de juros?"
                description={`A taxa de ${percentLabel(rate.monthly_percentage)} ao mês, a partir de ${formatDate(rate.start_date)}, deixará de valer.`}
                onConfirm={() => handleRemove(rate.id)}
              />
            </li>
          ))}
        </ul>
      )}

      <FormProvider {...methods}>
        {/* Está dentro do formulário do condomínio: o Enter adiciona a taxa em vez de salvar o condomínio. */}
        <div
          className="space-y-3 rounded-panel border border-border p-4"
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            void handleSubmit(onSubmit)();
          }}
        >
          <p className="mb-2 text-body font-medium">Adicionar taxa</p>
          <FieldRow>
            <TextField name="start_date" label="A partir de" type="date" required />
            <TextField
              name="monthly_percentage"
              label="Juros ao mês (%)"
              required
              mask={percent}
              inputMode="decimal"
              placeholder="1,00"
            />
          </FieldRow>
          <div className="flex justify-end pt-1">
            <Button type="button" disabled={createMutation.isPending} onClick={handleSubmit(onSubmit)}>
              {createMutation.isPending ? "Adicionando…" : "Adicionar taxa"}
            </Button>
          </div>
        </div>
      </FormProvider>
    </div>
  );
}
