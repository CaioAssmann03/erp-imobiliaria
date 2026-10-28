import { redirect } from "next/navigation";

import { condominiumUrl } from "@/lib/condominium-registry";

/** As sub-contas são uma seção da página do condomínio: um link antigo com `?condominium=` abre a seção; sem ele, a lista de condomínios. */
export default async function CostCentersPage({ searchParams }: { searchParams: Promise<{ condominium?: string }> }) {
  const { condominium } = await searchParams;
  redirect(condominium ? condominiumUrl(condominium, "sub-contas") : "/condominiums");
}
