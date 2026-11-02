import type { Metadata } from "next";

import { NewBlockChooseCondominium } from "@/app/(dashboard)/condominiums/_components/blocks/NewBlockChooseCondominium";

export const metadata: Metadata = { title: "Novo bloco" };

/** `/condominiums/blocks/new`: o novo bloco ainda sem condomínio; escolhido o condomínio, abre o formulário dele. */
export default function NewBlockPage() {
  return <NewBlockChooseCondominium />;
}
