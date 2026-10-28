import type { Metadata } from "next";

import { BlockForm } from "../../_components/BlockForm";
import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Editar bloco" };

export default async function EditBlockPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <FormPage>
      <PageHeader back={{ href: "/condominiums", label: "Condomínios" }} title="Editar bloco" />
      <BlockForm blockId={id} />
    </FormPage>
  );
}
