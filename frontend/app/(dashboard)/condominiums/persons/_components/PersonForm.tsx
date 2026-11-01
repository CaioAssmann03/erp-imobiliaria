"use client";

import { FormSkeleton } from "@/components/form/FormSkeleton";

import { usePersonsRetrieve } from "@/lib/api/generated";
import { personsUrl } from "@/lib/persons/person-workspace";
import { throwIfPageError } from "@/lib/query/page-error";
import { PERSON_DEFAULTS, personSchema, personToForm } from "@/lib/schemas/person";

import { PersonDeleteButton } from "./PersonDeleteButton";
import { ContactSection } from "./person-form/ContactSection";
import { IdentificationSection } from "./person-form/IdentificationSection";
import { usePersonSubmit } from "./person-form/use-person-submit";
import { RecordForm } from "@/components/form/RecordForm";
import { SectionAnchor } from "@/components/form/SectionAnchor";
import { useRecordForm } from "@/hooks/use-record-form";

export function PersonForm({ personId }: { personId?: string }) {
  const isEdit = personId !== undefined;

  const { data: person, isLoading, error: loadError } = usePersonsRetrieve(personId ?? "", {
    query: { enabled: isEdit },
  });
  throwIfPageError(loadError);

  const methods = useRecordForm({ schema: personSchema, defaults: PERSON_DEFAULTS, record: person, toForm: personToForm });
  const { submit, isSubmitting } = usePersonSubmit(personId, methods.setError);

  if (isEdit && isLoading) return <FormSkeleton sections={2} />;

  return (
    <RecordForm
      methods={methods}
      onSubmit={submit}
      isSubmitting={isSubmitting}
      cancelHref={personsUrl()}
      danger={person && <PersonDeleteButton personId={person.id} name={person.name} />}
    >
      <SectionAnchor id="identificacao">
        <IdentificationSection isEdit={isEdit} />
      </SectionAnchor>
      <SectionAnchor id="contato">
        <ContactSection />
      </SectionAnchor>
    </RecordForm>
  );
}
