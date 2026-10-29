import { redirect } from "next/navigation";

import { personUrl } from "@/lib/person-workspace";

/** O cadastro de pessoas mudou para dentro de Condomínios: um link antigo abre a nova tela. */
export default async function EditPersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(personUrl(id));
}
