"use client";

import { useRouter } from "next/navigation";

import { ChooseCondominiumCard } from "@/components/form/ChooseCondominiumCard";
import { BackLink } from "@/components/layout/BackLink";
import { newUnitUrl, unitsUrl } from "@/lib/condominiums/unit-workspace";

/** Client Component: o centro da nova unidade sem condomínio escolhido; escolher um leva ao formulário daquele condomínio e a lista da esquerda o segue. */
export function NewUnitChooseCondominium() {
  const router = useRouter();

  return (
    <>
      <div className="mb-6">
        <BackLink href={unitsUrl()} label="Unidades" />
        <h1 className="text-title">Nova unidade</h1>
      </div>
      <ChooseCondominiumCard what="da unidade" onChoose={(condominium) => router.replace(newUnitUrl(condominium))} />
    </>
  );
}
