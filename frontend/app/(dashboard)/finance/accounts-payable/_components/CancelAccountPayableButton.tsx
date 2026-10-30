"use client";

import { useQueryClient } from "@tanstack/react-query";

import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import {
  getAccountsPayableListQueryKey,
  getAccountsPayableRetrieveQueryKey,
  getDashboardRetrieveQueryKey,
  useAccountsPayableCancel,
} from "@/lib/api/generated";
import { applyServerErrors } from "@/lib/errors/form-errors";
import { toast } from "@/lib/errors/toast";

/** Client Component: cancela a conta aberta (confirmação). Ela continua na página, agora cancelada e só para consulta. */
export function CancelAccountPayableButton({ accountId, description }: { accountId: string; description: string }) {
  const queryClient = useQueryClient();
  const cancelMutation = useAccountsPayableCancel();

  const handleCancel = () =>
    cancelMutation.mutate(
      { id: accountId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getAccountsPayableListQueryKey() });
          queryClient.invalidateQueries({ queryKey: getAccountsPayableRetrieveQueryKey(accountId) });
          queryClient.invalidateQueries({ queryKey: getDashboardRetrieveQueryKey() });
          toast.success("Conta cancelada.");
        },
        onError: (error) => toast.error(applyServerErrors(error, () => undefined)),
      }
    );

  return (
    <ConfirmDeleteButton
      label="Cancelar conta"
      title="Cancelar conta a pagar?"
      description={`A conta "${description}" será cancelada e não poderá mais ser alterada.`}
      onConfirm={handleCancel}
      appearance="solid"
    />
  );
}
