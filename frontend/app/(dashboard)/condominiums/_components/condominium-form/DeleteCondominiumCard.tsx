"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { FormSection } from "@/components/form/FormSection";
import {
  getCondominiumsListInfiniteQueryKey,
  getCondominiumsListQueryKey,
  getDashboardRetrieveQueryKey,
  useCondominiumsDestroy,
} from "@/lib/api/generated";

/** Configurações do condomínio: por enquanto, excluir o cadastro (a lista do painel não tem ações por linha). */
export function DeleteCondominiumCard({ condominiumId, name }: { condominiumId: string; name: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const destroyMutation = useCondominiumsDestroy();

  const handleDelete = () =>
    destroyMutation.mutate(
      { id: condominiumId },
      {
        onSuccess: async () => {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: getCondominiumsListQueryKey() }),
            queryClient.invalidateQueries({ queryKey: getCondominiumsListInfiniteQueryKey() }),
            queryClient.invalidateQueries({ queryKey: getDashboardRetrieveQueryKey() }),
          ]);
          toast.success("Condomínio excluído.");
          router.push("/condominiums");
        },
        onError: () => toast.error("Não foi possível excluir o condomínio."),
      },
    );

  return (
    <FormSection title="Configurações">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-body font-medium">Excluir condomínio</p>
          <p className="text-caption text-ink-soft">Remove o cadastro do condomínio.</p>
        </div>
        <ConfirmDeleteButton
          title="Excluir condomínio?"
          description={`O condomínio "${name}" será excluído. Esta ação não pode ser desfeita.`}
          onConfirm={handleDelete}
        />
      </div>
    </FormSection>
  );
}
