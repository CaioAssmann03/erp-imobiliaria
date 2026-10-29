import { redirect } from "next/navigation";

import { personsUrl } from "@/lib/person-workspace";

/** O cadastro de pessoas mudou para dentro de Condomínios: um link antigo abre a nova tela. */
export default function PersonsPage() {
  redirect(personsUrl());
}
