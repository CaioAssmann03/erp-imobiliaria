"use client";

import { useRouter } from "next/navigation";

import { ChooseCondominiumCard } from "@/components/form/ChooseCondominiumCard";
import { BackLink } from "@/components/layout/BackLink";
import { newCostCenterUrl } from "@/lib/condominiums/cost-center-workspace";

/** Client Component: o centro da nova sub-conta sem condomínio escolhido; escolher um leva ao formulário daquele condomínio e a lista da esquerda o segue. */
export function NewCostCenterChooseCondominium() {
  const router = useRouter();

  return (
    <>
      <div className="mb-6">
        <BackLink href="/condominiums/cost-centers" label="Sub-contas" />
        <h1 className="text-title">Nova sub-conta</h1>
      </div>
      <ChooseCondominiumCard what="da sub-conta" onChoose={(condominium) => router.replace(newCostCenterUrl(condominium))} />
    </>
  );
}
