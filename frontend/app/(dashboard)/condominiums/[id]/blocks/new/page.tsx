import type { Metadata } from "next";

import { BlockForm } from "../../../_components/BlockForm";
import { CondominiumSideMenu } from "../../../_components/CondominiumSideMenu";
import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";
import { condominiumPageUrl, condominiumUrl } from "@/lib/condominium-registry";

export const metadata: Metadata = { title: "Novo bloco" };

export default async function NewCondominiumBlockPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listUrl = condominiumPageUrl(id, "blocks");

  return (
    <FormPage aside={<CondominiumSideMenu condominiumId={id} current="blocks" />}>
      <PageHeader back={{ href: condominiumUrl(id), label: "Condomínio" }} title="Novo bloco" />
      <BlockForm condominiumId={id} returnUrl={listUrl} />
    </FormPage>
  );
}
