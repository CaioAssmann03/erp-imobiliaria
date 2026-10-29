import { redirect } from "next/navigation";

/** As sub-contas são uma seção de cada condomínio; `?condominium=` abre a seção dele. */
export default async function CostCentersRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ condominium?: string }>;
}) {
  const { condominium } = await searchParams;
  redirect(condominium ? `/condominiums/${condominium}/cost-centers` : "/condominiums");
}
