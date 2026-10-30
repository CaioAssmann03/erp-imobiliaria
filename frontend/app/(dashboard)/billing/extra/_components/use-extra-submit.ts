"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { UseFormSetError } from "react-hook-form";

import { getBillingDocumentsListQueryKey, useBillingDocumentsExtra } from "@/lib/api/generated";
import type { ExtraBillingDocument, ExtraBillingResult } from "@/lib/api/generated/models";
import { extraErrorPath, extraToPayload } from "@/lib/billing/extra-billing-payload";
import { applyServerErrors } from "@/lib/errors/form-errors";
import { extraBillingFormToValues, type ExtraBillingFormInput, type ExtraBillingFormOutput } from "@/lib/schemas/extra-billing";
import { toast } from "@/lib/errors/toast";

/** Emite os boletos extras e guarda a resposta (emitidos e unidades puladas) para a tela mostrar. */
export function useExtraSubmit(setError: UseFormSetError<ExtraBillingFormInput>) {
  const queryClient = useQueryClient();
  const extraMutation = useBillingDocumentsExtra();
  const [result, setResult] = useState<ExtraBillingResult | null>(null);

  const submit = (values: ExtraBillingFormOutput) => {
    const payload = extraToPayload(extraBillingFormToValues(values));
    extraMutation.mutate(
      { data: payload as unknown as ExtraBillingDocument },
      {
        onSuccess: (response) => {
          queryClient.invalidateQueries({ queryKey: getBillingDocumentsListQueryKey() });
          setResult(response);
          if (response.issued.length > 0) toast.success(`${response.issued.length} boleto(s) extra emitido(s).`);
          else toast.error("Nenhum boleto foi emitido. Veja o motivo de cada unidade.");
        },
        onError: (error) => toast.error(applyServerErrors(error, setError, extraErrorPath)),
      }
    );
  };

  return { submit, isSubmitting: extraMutation.isPending, result, clearResult: () => setResult(null) };
}
