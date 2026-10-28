import { redirect } from "next/navigation";

import { unitsUrl } from "@/lib/unit-workspace";

/** As unidades de um condomínio são o cadastro de unidades com o condomínio já escolhido (`?block=` também filtra a lista). */
export default async function CondominiumUnitsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ block?: string }>;
}) {
  const [{ id }, { block }] = await Promise.all([params, searchParams]);
  redirect(`${unitsUrl(id)}${block ? `&block=${block}` : ""}`);
}
