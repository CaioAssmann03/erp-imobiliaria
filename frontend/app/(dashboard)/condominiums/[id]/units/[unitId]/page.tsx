import type { Metadata } from "next";

import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";
import { UnitForm } from "../_components/UnitForm";

export const metadata: Metadata = { title: "Editar unidade" };

export default async function EditUnitPage({
  params,
}: {
  params: Promise<{ id: string; unitId: string }>;
}) {
  const { id, unitId } = await params;

  return (
    <FormPage>
      <PageHeader
        back={{ href: `/condominiums/${id}/units`, label: "Unidades" }}
        title="Editar unidade"
      />
      <UnitForm condominiumId={id} unitId={unitId} />
    </FormPage>
  );
}
