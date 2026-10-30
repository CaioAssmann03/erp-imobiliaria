import type { Metadata } from "next";

import { FormPage } from "@/components/form/FormPage";
import { UnitForm } from "../_components/UnitForm";
import { UnitHeader } from "../_components/UnitHeader";
import { UnitSideMenu } from "../_components/UnitSideMenu";

export const metadata: Metadata = { title: "Unidade" };

/** A página de uma unidade: dados gerais, proprietário, inquilino e cobrança, e o menu da direita (as seções e as pessoas da unidade). */
export default async function UnitPage({ params }: { params: Promise<{ id: string; unitId: string }> }) {
  const { id, unitId } = await params;

  return (
    <FormPage aside={<UnitSideMenu unitId={unitId} />}>
      <UnitHeader condominiumId={id} unitId={unitId} />
      <UnitForm condominiumId={id} unitId={unitId} />
    </FormPage>
  );
}
