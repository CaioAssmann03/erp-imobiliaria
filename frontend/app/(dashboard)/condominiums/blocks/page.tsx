import { redirect } from "next/navigation";

/** Os blocos são uma seção de cada condomínio; `?condominium=` abre a seção dele. */
export default async function BlocksRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ condominium?: string }>;
}) {
  const { condominium } = await searchParams;
  redirect(condominium ? `/condominiums/${condominium}/blocks` : "/condominiums");
}
