import type { Metadata } from "next";

import { SectionIndex } from "@/components/SectionIndex";
import { UNIT_SECTIONS } from "@/lib/unit-workspace";
import { UnitForm } from "../_components/UnitForm";
import { UnitHeader } from "../_components/UnitHeader";

export const metadata: Metadata = { title: "Unidade" };

/** A página de uma unidade: dados gerais, proprietário, inquilino e cobrança, e o índice das seções à direita. */
export default async function UnitPage({ params }: { params: Promise<{ id: string; unitId: string }> }) {
  const { id, unitId } = await params;

  return (
    <div className="flex items-start gap-8">
      <div className="min-w-0 flex-1 pb-24">
        <UnitHeader condominiumId={id} unitId={unitId} />
        <UnitForm condominiumId={id} unitId={unitId} />
      </div>
      <SectionIndex sections={UNIT_SECTIONS} label="Seções da unidade" title="Nesta unidade" />
    </div>
  );
}
