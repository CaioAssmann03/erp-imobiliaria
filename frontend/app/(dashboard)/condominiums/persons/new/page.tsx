import type { Metadata } from "next";

import { BackLink } from "@/components/BackLink";
import { FormPage } from "@/components/form/FormPage";
import { SectionIndex } from "@/components/SectionIndex";
import { PERSON_SECTIONS, personsUrl } from "@/lib/person-workspace";
import { PersonForm } from "../_components/PersonForm";

export const metadata: Metadata = { title: "Nova pessoa" };

export default function NewPersonPage() {
  return (
    <FormPage aside={<SectionIndex sections={PERSON_SECTIONS} label="Seções da pessoa" title="Nesta pessoa" />}>
      <div className="mb-6">
        <div className="lg:hidden">
          <BackLink href={personsUrl()} label="Pessoas" />
        </div>
        <h1 className="text-title">Nova pessoa</h1>
      </div>
      <PersonForm />
    </FormPage>
  );
}
