import type { Metadata } from "next";

import { CondominiumForm } from "../_components/CondominiumForm";
import { CondominiumHeader } from "../_components/CondominiumHeader";
import { CondominiumSideMenu } from "../_components/CondominiumSideMenu";
import { FormPage } from "@/components/form/FormPage";
import { getMapsEmbedKey } from "@/lib/maps-embed-key";

export const metadata: Metadata = { title: "Condomínio" };

/** A página de um condomínio: só o que é dele em si (dados e taxa); blocos, unidades e sub-contas abrem em telas próprias, pelo menu da direita. */
export default async function CondominiumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <FormPage aside={<CondominiumSideMenu condominiumId={id} />}>
      <CondominiumHeader condominiumId={id} />
      <CondominiumForm condominiumId={id} mapsEmbedKey={getMapsEmbedKey()} />
    </FormPage>
  );
}
