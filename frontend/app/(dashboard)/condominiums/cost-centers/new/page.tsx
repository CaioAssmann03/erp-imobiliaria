import type { Metadata } from "next";

import { NewCostCenterChooseCondominium } from "@/app/(dashboard)/condominiums/_components/cost-centers/NewCostCenterChooseCondominium";

export const metadata: Metadata = { title: "Nova sub-conta" };

/** `/condominiums/cost-centers/new`: a nova sub-conta ainda sem condomínio (o **+** da lista sem condomínio escolhido); escolhido o condomínio, abre o formulário dele. */
export default function NewCostCenterPage() {
  return <NewCostCenterChooseCondominium />;
}
