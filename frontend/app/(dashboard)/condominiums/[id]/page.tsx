import type { Metadata } from "next";

import { CondominiumCode } from "../_components/CondominiumCode";
import { CondominiumForm } from "../_components/CondominiumForm";
import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";
import { getMapsEmbedKey } from "@/lib/maps-embed-key";

export const metadata: Metadata = { title: "Editar condomínio" };

export default async function EditCondominiumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <FormPage>
      <PageHeader
        back={{ href: "/condominiums", label: "Condomínios" }}
        title="Editar condomínio"
        description={<CondominiumCode condominiumId={id} />}
      />
      <CondominiumForm condominiumId={id} mapsEmbedKey={getMapsEmbedKey()} />
    </FormPage>
  );
}
