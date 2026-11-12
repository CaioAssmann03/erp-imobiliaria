"use client";

import { type QueryClient, type QueryKey, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { applyServerErrors } from "@/lib/errors/form-errors";
import { toast } from "@/lib/errors/toast";

/**
 * O **Excluir** da barra de ações de um registro aberto (confirmação, exclusão, avisos e volta à tela vazia do módulo), o mesmo em todo cadastro.
 * Cada módulo passa só o que é seu: `destroy` (chama a mutação do registro com as opções recebidas), as listas a atualizar (`invalidate`; `onDeleted`
 * para o que não é uma chave só), a mensagem de `success`, para onde ir (`redirectTo`) e o aviso de erro: com `failure` um texto fixo; sem ele, a
 * mensagem do servidor (registro em uso é recusado pelo backend e o motivo chega ao aviso).
 */
export function RecordDeleteButton({
  title,
  description,
  destroy,
  invalidate,
  onDeleted,
  success,
  failure,
  redirectTo,
}: {
  title: string;
  description: string;
  destroy: (options: { onSuccess: () => void; onError: (error: unknown) => void }) => void;
  invalidate: readonly QueryKey[];
  onDeleted?: (queryClient: QueryClient) => void;
  success: string;
  failure?: string;
  redirectTo: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleDelete = () =>
    destroy({
      onSuccess: () => {
        for (const queryKey of invalidate) queryClient.invalidateQueries({ queryKey });
        onDeleted?.(queryClient);
        toast.success(success);
        router.push(redirectTo);
      },
      onError: (error) => toast.error(failure ?? applyServerErrors(error, () => undefined)),
    });

  return <ConfirmDeleteButton title={title} description={description} onConfirm={handleDelete} appearance="solid" />;
}
