import { redirect } from "next/navigation";

import { condominiumPageUrl } from "@/lib/condominium-registry";

/** As sub-contas de um condomínio têm tela própria: um link antigo com `?condominium=` abre a dele; sem ele, a lista de condomínios. */
export default async function CostCentersPage({ searchParams }: { searchParams: Promise<{ condominium?: string }> }) {
  const { condominium } = await searchParams;
  redirect(condominium ? condominiumPageUrl(condominium, "cost-centers") : "/condominiums");
}
