import type { Metadata } from "next";

import { BackLink } from "@/components/layout/BackLink";
import { condominiumUrl } from "@/lib/condominiums/condominium-registry";
import { UnitForm } from "@/app/(dashboard)/condominiums/(condominium)/[id]/units/_components/UnitForm";

export const metadata: Metadata = { title: "Nova unidade" };

export default async function NewUnitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <div className="mb-6">
        <BackLink href={condominiumUrl(id)} label="Condomínio" />
        <h1 className="text-title">Nova unidade</h1>
      </div>
      <UnitForm condominiumId={id} />
    </>
  );
}
