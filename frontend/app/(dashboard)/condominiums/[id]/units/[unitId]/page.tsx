import type { Metadata } from "next";
import { Suspense } from "react";

import { UnitForm } from "../_components/UnitForm";
import { UnitHeader } from "../_components/UnitHeader";

export const metadata: Metadata = { title: "Unidade" };

/** A página de uma unidade: dados gerais, proprietário, inquilino e cobrança, e o menu da direita (as seções e as pessoas da unidade). */
export default async function UnitPage({ params }: { params: Promise<{ id: string; unitId: string }> }) {
  const { id, unitId } = await params;

  return (
    <>
      <Suspense fallback={null}>
        <UnitHeader condominiumId={id} unitId={unitId} />
      </Suspense>
      <UnitForm condominiumId={id} unitId={unitId} />
    </>
  );
}
