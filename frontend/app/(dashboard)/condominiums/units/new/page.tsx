import { redirect } from "next/navigation";

import { unitsUrl } from "@/lib/condominiums/unit-workspace";

/** Uma unidade nova nasce dentro de um condomínio: a tela de unidades pede o condomínio e tem o botão Nova. */
export default function NewUnitFromListPage() {
  redirect(unitsUrl());
}
