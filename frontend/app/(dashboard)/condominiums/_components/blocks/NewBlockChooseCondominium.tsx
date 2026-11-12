"use client";

import { useRouter } from "next/navigation";

import { ChooseCondominiumCard } from "@/components/form/ChooseCondominiumCard";
import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/layout/PageHeader";
import { newBlockUrl } from "@/lib/condominiums/block-workspace";

/** Client Component: a tela do novo bloco sem condomínio escolhido; escolher um leva ao formulário daquele condomínio. */
export function NewBlockChooseCondominium() {
  const router = useRouter();

  return (
    <FormPage>
      <PageHeader back={{ href: "/condominiums", label: "Condomínios" }} title="Novo bloco" />
      <ChooseCondominiumCard what="do bloco" onChoose={(condominium) => router.replace(newBlockUrl(condominium))} />
    </FormPage>
  );
}
