import { redirect } from "next/navigation";

import { condominiumUrl } from "@/lib/condominium-registry";

/** Os blocos de um condomínio são uma seção da página dele. */
export default async function CondominiumBlocksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(condominiumUrl(id, "blocos-e-unidades"));
}
