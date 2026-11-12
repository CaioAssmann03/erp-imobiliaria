import { redirect } from "next/navigation";

import { condominiumPageUrl } from "@/lib/condominiums/condominium-registry";

/** Os blocos de um condomínio têm tela própria: um link antigo com `?condominium=` abre a dele; sem ele, a lista de condomínios. */
export default async function BlocksPage({ searchParams }: { searchParams: Promise<{ condominium?: string }> }) {
  const { condominium } = await searchParams;
  redirect(condominium ? condominiumPageUrl(condominium, "blocks") : "/condominiums");
}
