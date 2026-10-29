import { redirect } from "next/navigation";

import { newPersonUrl } from "@/lib/person-workspace";

/** O cadastro de pessoas mudou para dentro de Condomínios: um link antigo abre a nova tela. */
export default function NewPersonPage() {
  redirect(newPersonUrl());
}
