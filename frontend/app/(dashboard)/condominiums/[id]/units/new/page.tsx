import type { Metadata } from "next";

import { LinkButton } from "@/components/LinkButton";
import { SectionIndex } from "@/components/SectionIndex";
import { UNIT_SECTIONS, unitsUrl } from "@/lib/unit-workspace";
import { UnitForm } from "../_components/UnitForm";

export const metadata: Metadata = { title: "Nova unidade" };

export default async function NewUnitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="flex items-start gap-8">
      <div className="min-w-0 flex-1 pb-24">
        <div className="mb-6">
          <LinkButton href={unitsUrl(id)} variant="ghost" size="sm" className="-ml-2.5 mb-2 px-2.5 text-ink-soft hover:text-ink lg:hidden">
            Unidades
          </LinkButton>
          <h1 className="text-title">Nova unidade</h1>
        </div>
        <UnitForm condominiumId={id} />
      </div>
      <SectionIndex sections={UNIT_SECTIONS} label="Seções da unidade" title="Nesta unidade" />
    </div>
  );
}
