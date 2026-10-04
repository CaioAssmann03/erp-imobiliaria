import type { Metadata } from "next";
import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";
import { UnitForm } from "../_components/UnitForm";

export const metadata: Metadata = { title: "Nova unidade" };

export default async function NewUnitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <FormPage>
      <PageHeader
        back={{ href: `/condominiums/${id}/units`, label: "Unidades" }}
        title="Nova unidade"
      />
      <UnitForm condominiumId={id} />
    </FormPage>
  );
}
