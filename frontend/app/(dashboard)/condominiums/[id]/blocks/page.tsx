import { redirect } from "next/navigation";

/** A lista de blocos de um condomínio é a lista geral com o filtro de condomínio aplicado. */
export default async function CondominiumBlocksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/condominiums/blocks?condominium=${id}`);
}
