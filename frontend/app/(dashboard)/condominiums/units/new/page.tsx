import type { Metadata } from "next";

import { NewUnitChooseCondominium } from "@/app/(dashboard)/condominiums/(condominium)/[id]/units/_components/NewUnitChooseCondominium";

export const metadata: Metadata = { title: "Nova unidade" };

/** `/condominiums/units/new`: a nova unidade ainda sem condomínio (o **+** da lista sem condomínio escolhido); escolhido o condomínio, abre o formulário dele. */
export default function NewUnitFromListPage() {
  return <NewUnitChooseCondominium />;
}
