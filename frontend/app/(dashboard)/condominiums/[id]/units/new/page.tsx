import type { Metadata } from "next";

import { FormPage } from "@/components/form/FormPage";
import { LinkButton } from "@/components/LinkButton";
import { SectionIndex } from "@/components/SectionIndex";
import { condominiumUrl } from "@/lib/condominium-registry";
import { UNIT_SECTIONS } from "@/lib/unit-workspace";
import { UnitForm } from "../_components/UnitForm";

export const metadata: Metadata = { title: "Nova unidade" };

export default async function NewUnitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <FormPage aside={<SectionIndex sections={UNIT_SECTIONS} label="Seções da unidade" title="Nesta unidade" />}>
      <div className="mb-6">
        <LinkButton href={condominiumUrl(id)} variant="ghost" size="sm" className="-ml-2.5 mb-2 px-2.5 text-ink-soft hover:text-ink lg:hidden">
          Condomínio
        </LinkButton>
        <h1 className="text-title">Nova unidade</h1>
      </div>
      <UnitForm condominiumId={id} />
    </FormPage>
  );
}
