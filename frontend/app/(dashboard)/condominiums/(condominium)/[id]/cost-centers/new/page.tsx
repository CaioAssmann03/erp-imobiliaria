import type { Metadata } from "next";

import { CostCenterForm } from "@/app/(dashboard)/condominiums/_components/cost-centers/CostCenterForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { condominiumUrl } from "@/lib/condominiums/condominium-registry";

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
