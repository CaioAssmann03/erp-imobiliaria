"use client";

import { useQueryClient } from "@tanstack/react-query";

import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import {
  getBillingDocumentsListQueryKey,
  getBillingDocumentsRetrieveQueryKey,
  useBillingDocumentsCancel,
} from "@/lib/api/generated";
import type { BillingDocument } from "@/lib/api/generated/models";
import { apiErrorMessage } from "@/lib/errors/form-errors";
import { toast } from "@/lib/errors/toast";

/** Cancela um documento emitido ou registrado; o mês da unidade fica livre para uma nova emissão. */
export function CancelBillingDocumentButton({ document }: { document: BillingDocument }) {
  const queryClient = useQueryClient();
  const cancelMutation = useBillingDocumentsCancel();

  const cancel = () =>
    cancelMutation.mutate(
      { id: document.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getBillingDocumentsListQueryKey() });
          toast.success("Documento cancelado.");
          queryClient.invalidateQueries({ queryKey: getBillingDocumentsRetrieveQueryKey(document.id) });
        },
        onError: (error) => toast.error(apiErrorMessage(error, "Não foi possível cancelar o documento.")),
      }
    );

  return (
    <ConfirmDeleteButton
      label="Cancelar documento"
      title="Cancelar documento de cobrança?"
      description={`O documento da unidade ${document.unit_name} (${document.condominium_name}) será cancelado e o mês ficará livre para uma nova emissão. Esta ação não pode ser desfeita.`}
      onConfirm={cancel}
    />
  );
}
