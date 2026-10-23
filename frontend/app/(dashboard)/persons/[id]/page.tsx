import type { Metadata } from "next";

import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";
import { PersonCode } from "../_components/PersonCode";
import { PersonForm } from "../_components/PersonForm";

export const metadata: Metadata = { title: "Editar pessoa" };

export default async function EditPersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <FormPage>
      <PageHeader
        back={{ href: "/persons", label: "Pessoas" }}
        title="Editar pessoa"
        description={<PersonCode personId={id} />}
      />
      <PersonForm personId={id} />
    </FormPage>
  );
}
