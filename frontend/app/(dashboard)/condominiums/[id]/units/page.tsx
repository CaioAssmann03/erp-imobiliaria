import { redirect } from "next/navigation";

/** A lista de unidades de um condomínio é a lista geral com o filtro de condomínio aplicado. */
export default async function CondominiumUnitsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ block?: string }>;
}) {
  const [{ id }, { block }] = await Promise.all([params, searchParams]);
  const query = new URLSearchParams({ condominium: id, ...(block ? { block } : {}) });
  redirect(`/condominiums/units?${query}`);
}
