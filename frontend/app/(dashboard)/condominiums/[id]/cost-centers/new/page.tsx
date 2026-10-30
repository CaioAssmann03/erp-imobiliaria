import type { Metadata } from "next";

import { CostCenterForm } from "../../../_components/CostCenterForm";
import { PageHeader } from "@/components/PageHeader";
import { condominiumUrl } from "@/lib/condominium-registry";

export const metadata: Metadata = { title: "Nova sub-conta" };

export default async function NewCondominiumCostCenterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <PageHeader back={{ href: condominiumUrl(id), label: "Condomínio" }} title="Nova sub-conta" />
      <CostCenterForm condominiumId={id} />
    </>
  );
}
