import { redirect } from "next/navigation";

/** O extrato de um condomínio é o extrato geral com o condomínio já escolhido. */
export default async function CondominiumStatementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/finance/statement?condominium=${id}`);
}
