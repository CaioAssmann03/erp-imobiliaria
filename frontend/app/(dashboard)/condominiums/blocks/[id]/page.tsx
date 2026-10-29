import type { Metadata } from "next";

import { BlockForm } from "../../_components/BlockForm";
import { BlockSideMenu } from "../../_components/BlockSideMenu";
import { CondominiumBackLink } from "../../_components/CondominiumBackLink";
import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Editar bloco" };

export default async function EditBlockPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <FormPage aside={<BlockSideMenu blockId={id} />}>
      <PageHeader backSlot={<CondominiumBackLink blockId={id} />} title="Editar bloco" />
      <BlockForm blockId={id} />
    </FormPage>
  );
}
