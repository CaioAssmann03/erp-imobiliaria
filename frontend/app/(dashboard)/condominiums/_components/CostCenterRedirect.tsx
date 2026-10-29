"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { FormSkeleton } from "@/components/form/FormSkeleton";
import { useCostCentersRetrieve } from "@/lib/api/generated";
import { throwIfNotFound } from "@/lib/query/not-found";

/** Client Component: a sub-conta só tem tela dentro do condomínio; descobre qual e segue para lá. */
export function CostCenterRedirect({ costCenterId }: { costCenterId: string }) {
  const router = useRouter();
  const { data: costCenter, error } = useCostCentersRetrieve(costCenterId);
  throwIfNotFound(error);

  useEffect(() => {
    if (costCenter) router.replace(`/condominiums/${costCenter.condominium}/cost-centers/${costCenter.id}`);
  }, [costCenter, router]);

  return <FormSkeleton sections={1} />;
}
