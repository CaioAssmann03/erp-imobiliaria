"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { LinkButton } from "@/components/LinkButton";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getDashboardRetrieveQueryKey,
  getUnitsListQueryKey,
  useUnitsDestroy,
  useUnitsRetrieve,
} from "@/lib/api/generated";
import { invalidateApportionment } from "@/lib/query/apportionment";
import { unitTypeLabel } from "@/lib/schemas/unit";
import { unitListLabel, unitsUrl } from "@/lib/unit-workspace";

/** Client Component: o nome da unidade aberta, suas marcas e **Excluir**; usa a mesma consulta do formulário (uma só chamada). */
export function UnitHeader({ condominiumId, unitId }: { condominiumId: string; unitId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: unit } = useUnitsRetrieve(unitId);
  const destroyMutation = useUnitsDestroy();

  if (!unit) return <Skeleton className="mb-6 h-9 w-72 rounded-control" />;

  const handleDelete = () =>
    destroyMutation.mutate(
      { id: unit.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getUnitsListQueryKey() });
          queryClient.invalidateQueries({ queryKey: getDashboardRetrieveQueryKey() });
          invalidateApportionment(queryClient);
          toast.success("Unidade excluída.");
          router.push(unitsUrl(condominiumId));
        },
        onError: () => toast.error("Não foi possível excluir a unidade."),
      }
    );

  return (
    <div className="mb-6">
      <LinkButton
        href={unitsUrl(condominiumId)}
        variant="ghost"
        size="sm"
        className="-ml-2.5 mb-2 px-2.5 text-ink-soft hover:text-ink lg:hidden"
      >
        Unidades
      </LinkButton>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-title">{unitListLabel(unitTypeLabel(unit.type), unit.name)}</h1>
        {unit.is_manager_unit && (
          <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-caption font-medium text-brand">Síndico</span>
        )}
        <StatusBadge active={unit.active ?? true} />
        <div className="ml-auto">
          <ConfirmDeleteButton
            title="Excluir unidade?"
            description={`A unidade "${unit.name}" será excluída. Esta ação não pode ser desfeita.`}
            onConfirm={handleDelete}
          />
        </div>
      </div>
    </div>
  );
}
