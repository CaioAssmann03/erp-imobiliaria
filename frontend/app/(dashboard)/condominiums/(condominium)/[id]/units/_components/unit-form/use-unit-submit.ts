"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { UseFormSetError } from "react-hook-form";

import {
  getDashboardRetrieveQueryKey,
  getUnitsListQueryKey,
  getUnitsRetrieveQueryKey,
  useUnitPeopleCreate,
  useUnitsCreate,
  useUnitsPartialUpdate,
} from "@/lib/api/generated";
import type { Unit } from "@/lib/api/generated/models";
import { applyServerErrors } from "@/lib/errors/form-errors";
import { invalidateApportionment } from "@/lib/query/apportionment";
import { toast } from "@/lib/errors/toast";
import { unitUrl } from "@/lib/condominiums/unit-workspace";
import { pendingLinkPayload, type PendingLink } from "@/app/(dashboard)/condominiums/(condominium)/[id]/units/_components/unit-people/pending-link";
import { unitToPayload, type UnitFormInput, type UnitFormOutput } from "@/lib/schemas/unit";

export function useUnitSubmit(
  condominiumId: string,
  unitId: string | undefined,
  setError: UseFormSetError<UnitFormInput>,
  /** Na unidade nova: os proprietários e inquilinos escolhidos, gravados depois da unidade (o vínculo precisa do id dela). */
  pendingLinks: readonly PendingLink[] = []
) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createMutation = useUnitsCreate();
  const updateMutation = useUnitsPartialUpdate();
  const createLink = useUnitPeopleCreate();
  const [isLinking, setIsLinking] = useState(false);
  const isEdit = unitId !== undefined;

  const invalidate = (id: string) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: getUnitsListQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getDashboardRetrieveQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getUnitsRetrieveQueryKey(id) }),
      invalidateApportionment(queryClient),
    ]);

  const onError = (error: unknown) => toast.error(applyServerErrors(error, setError));

  const submit = (values: UnitFormOutput) => {
    const payload = unitToPayload(values, condominiumId, isEdit);

    if (isEdit) {
      updateMutation.mutate(
        { id: unitId, data: payload as Partial<Unit> },
        {
          onSuccess: () => {
            invalidate(unitId);
            toast.success("Unidade salva.");
          },
          onError,
        }
      );
    } else {
      createMutation.mutate(
        { data: payload as unknown as Unit },
        {
          onSuccess: async (created) => {
            // A unidade já existe: grava os vínculos, um a um. Se algum for recusado a unidade fica, e os que faltam se refazem na tela dela.
            setIsLinking(true);
            const failed: string[] = [];
            for (const link of pendingLinks) {
              try {
                await createLink.mutateAsync({ data: pendingLinkPayload(link, created.id) });
              } catch (error) {
                failed.push(`${link.person.name}: ${applyServerErrors(error, () => undefined)}`);
              }
            }
            setIsLinking(false);
            await invalidate(created.id);
            if (failed.length > 0) {
              toast.error(`Unidade cadastrada, mas ${failed.length === 1 ? "um vínculo não foi gravado" : `${failed.length} vínculos não foram gravados`}. ${failed.join(" · ")}`);
            } else {
              toast.success(pendingLinks.length > 0 ? "Unidade cadastrada com os vínculos." : "Unidade cadastrada.");
            }
            router.push(unitUrl(condominiumId, created.id));
          },
          onError,
        }
      );
    }
  };

  return { submit, isSubmitting: createMutation.isPending || updateMutation.isPending || isLinking };
}
