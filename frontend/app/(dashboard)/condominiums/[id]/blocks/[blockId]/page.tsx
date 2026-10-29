import type { Metadata } from "next";

import { BlockForm } from "../../../_components/BlockForm";
import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Editar bloco" };

export default async function EditCondominiumBlockPage({
  params,
}: {
  params: Promise<{ id: string; blockId: string }>;
}) {
  const { id, blockId } = await params;
  const listUrl = `/condominiums/${id}/blocks`;

  return (
    <FormPage>
      <PageHeader back={{ href: listUrl, label: "Blocos" }} title="Editar bloco" />
      <BlockForm blockId={blockId} condominiumId={id} returnUrl={listUrl} />
    </FormPage>
  );
}
