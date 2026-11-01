"use client";

import { useRouter } from "next/navigation";
import { type FieldValues, FormProvider, type SubmitHandler, type UseFormReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { toast } from "@/lib/errors/toast";

import { FormActions } from "./FormActions";

/**
 * A casca do formulário de um cadastro, a mesma em todo módulo: o `FormProvider`, o `<form>` (sem a validação do navegador; um aviso quando algum campo
 * está inválido), as seções (`children`) e a barra de ações com o Salvar, o Cancelar para `cancelHref` (`cancelLabel` o renomeia), as `actions` extras
 * antes dele e, na edição, o `danger` (Excluir). `methods` vem de `useRecordForm`.
 */
export function RecordForm<TInput extends FieldValues, TOutput>({
  methods,
  onSubmit,
  isSubmitting,
  cancelHref,
  cancelLabel = "Cancelar",
  submitLabel,
  submittingLabel,
  actions,
  danger,
  children,
}: {
  methods: UseFormReturn<TInput, unknown, TOutput>;
  onSubmit: SubmitHandler<TOutput>;
  isSubmitting: boolean;
  cancelHref: string;
  cancelLabel?: string;
  /** O texto do Salvar e o dele enquanto envia, quando não é "Salvar" (Incluir lançamento, Emitindo…). */
  submitLabel?: string;
  submittingLabel?: string;
  actions?: React.ReactNode;
  danger?: React.ReactNode;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={methods.handleSubmit(onSubmit, () => toast.error("Corrija os campos destacados."))} className="space-y-4">
        {children}
        <FormActions isSubmitting={isSubmitting} submitLabel={submitLabel} submittingLabel={submittingLabel} danger={danger}>
          {actions}
          <Button type="button" variant="secondary" onClick={() => router.push(cancelHref)}>
            {cancelLabel}
          </Button>
        </FormActions>
      </form>
    </FormProvider>
  );
}
