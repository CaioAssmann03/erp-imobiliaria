import type { Metadata } from "next";

import { BlockForm } from "@/app/(dashboard)/condominiums/_components/blocks/BlockForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { condominiumPageUrl, condominiumUrl } from "@/lib/condominiums/condominium-registry";

export const metadata: Metadata = { title: "Novo bloco" };

export default async function NewCondominiumBlockPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listUrl = condominiumPageUrl(id, "blocks");

  return (
    <>
      <PageHeader back={{ href: condominiumUrl(id), label: "Condomínio" }} title="Novo bloco" />
      <BlockForm condominiumId={id} returnUrl={listUrl} />
    </>
  );
}
