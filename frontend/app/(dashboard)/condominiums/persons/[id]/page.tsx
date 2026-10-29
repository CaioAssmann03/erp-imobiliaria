import type { Metadata } from "next";

import { FormPage } from "@/components/form/FormPage";
import { SectionIndex } from "@/components/SectionIndex";
import { PERSON_SECTIONS } from "@/lib/person-workspace";
import { PersonForm } from "../_components/PersonForm";
import { PersonHeader } from "../_components/PersonHeader";

export const metadata: Metadata = { title: "Pessoa" };

export default async function EditPersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <FormPage aside={<SectionIndex sections={PERSON_SECTIONS} label="Seções da pessoa" title="Nesta pessoa" />}>
      <PersonHeader personId={id} />
      <PersonForm personId={id} />
    </FormPage>
  );
}
