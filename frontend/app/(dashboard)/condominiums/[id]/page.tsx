import type { Metadata } from "next";
import { Suspense } from "react";

import { BlocksTable } from "../_components/BlocksTable";
import { CondominiumForm } from "../_components/CondominiumForm";
import { CondominiumHeader } from "../_components/CondominiumHeader";
import { CostCentersTable } from "../_components/CostCentersTable";
import { RegistrySection } from "../_components/RegistrySection";
import { ListFallback } from "@/components/data-list";
import { LinkButton } from "@/components/LinkButton";
import { SectionIndex } from "@/components/SectionIndex";
import { REGISTRY_SECTIONS } from "@/lib/condominium-registry";
import { getMapsEmbedKey } from "@/lib/maps-embed-key";

export const metadata: Metadata = { title: "Condomínio" };

/** A página de um condomínio: dados e taxa (o formulário), blocos e unidades, sub-contas, e o índice das seções à direita. */
export default async function CondominiumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="flex items-start gap-8">
      <div className="min-w-0 flex-1 space-y-10 pb-24">
        <div>
          <CondominiumHeader condominiumId={id} />
          <CondominiumForm condominiumId={id} mapsEmbedKey={getMapsEmbedKey()} />
        </div>

        <RegistrySection
          id="blocos-e-unidades"
          title="Blocos e unidades"
          actions={
            <>
              <LinkButton href={`/condominiums/${id}/blocks/new`} variant="secondary">
                Novo bloco
              </LinkButton>
              <LinkButton href={`/condominiums/${id}/units/new`}>
                Nova unidade
              </LinkButton>
            </>
          }
        >
          <Suspense fallback={<ListFallback />}>
            <BlocksTable condominiumId={id} />
          </Suspense>
          <LinkButton href={`/condominiums/units?condominium=${id}`} variant="ghost" size="sm" className="text-ink-soft">
            Ver as unidades deste condomínio
          </LinkButton>
        </RegistrySection>

        <RegistrySection
          id="sub-contas"
          title="Sub-contas"
          actions={
            <LinkButton href={`/condominiums/${id}/cost-centers/new`}>
              Nova sub-conta
            </LinkButton>
          }
        >
          <Suspense fallback={<ListFallback />}>
            <CostCentersTable condominiumId={id} />
          </Suspense>
        </RegistrySection>
      </div>

      <SectionIndex sections={REGISTRY_SECTIONS} label="Seções do condomínio" title="Neste condomínio" />
    </div>
  );
}
