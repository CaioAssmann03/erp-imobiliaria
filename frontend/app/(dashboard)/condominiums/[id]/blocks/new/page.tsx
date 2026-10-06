import type { Metadata } from "next";

import { BlockForm } from "../../../_components/BlockForm";
import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Novo bloco" };

export default async function NewCondominiumBlockPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listUrl = `/condominiums/${id}/blocks`;

  return (
    <FormPage>
      <PageHeader back={{ href: listUrl, label: "Blocos" }} title="Novo bloco" />
      <BlockForm condominiumId={id} returnUrl={listUrl} />
    </FormPage>
  );
}
