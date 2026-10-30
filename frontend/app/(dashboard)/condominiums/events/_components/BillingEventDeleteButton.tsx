"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { getBillingEventsListQueryKey, useBillingEventsDestroy } from "@/lib/api/generated";
import { eventsUrl } from "@/lib/billing-event-workspace";
import { applyServerErrors } from "@/lib/form-errors";

/** Client Component: exclui o evento aberto (confirmação) e volta à tela de eventos, sem nenhum aberto. Um evento usado por lançamentos não sai: o backend recusa e a mensagem vem no aviso (desative em vez de excluir). */
export function BillingEventDeleteButton({ billingEventId, name }: { billingEventId: string; name: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const destroyMutation = useBillingEventsDestroy();

  const handleDelete = () =>
    destroyMutation.mutate(
      { id: billingEventId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getBillingEventsListQueryKey() });
          toast.success("Evento excluído.");
          router.push(eventsUrl());
        },
        onError: (error) => toast.error(applyServerErrors(error, () => undefined)),
      }
    );

  return (
    <ConfirmDeleteButton
      title="Excluir evento?"
      description={`O evento "${name}" será excluído. Esta ação não pode ser desfeita.`}
      onConfirm={handleDelete}
      appearance="solid"
    />
  );
}
