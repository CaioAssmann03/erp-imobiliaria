"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

import { FormActions } from "@/components/form/FormActions";
import { FormSkeleton } from "@/components/form/FormSkeleton";
import { Button } from "@/components/ui/button";
import { usePersonsRetrieve } from "@/lib/api/generated";
import { throwIfNotFound } from "@/lib/query/not-found";
import {
  PERSON_DEFAULTS,
  personSchema,
  personToForm,
  type PersonFormInput,
  type PersonFormOutput,
} from "@/lib/schemas/person";

import { ContactSection } from "./person-form/ContactSection";
import { IdentificationSection } from "./person-form/IdentificationSection";
import { usePersonSubmit } from "./person-form/use-person-submit";

export function PersonForm({ personId }: { personId?: string }) {
  const router = useRouter();
  const isEdit = personId !== undefined;

  const { data: person, isLoading, error: loadError } = usePersonsRetrieve(personId ?? "", {
    query: { enabled: isEdit },
  });
  throwIfNotFound(loadError);

  const methods = useForm<PersonFormInput, unknown, PersonFormOutput>({
    resolver: zodResolver(personSchema),
    defaultValues: PERSON_DEFAULTS,
    mode: "onTouched",
  });
  const { handleSubmit, reset, setError } = methods;
  const { submit, isSubmitting } = usePersonSubmit(personId, setError);

  useEffect(() => {
    if (person) reset(personToForm(person));
  }, [person, reset]);

  if (isEdit && isLoading) return <FormSkeleton sections={2} />;

  return (
    <FormProvider {...methods}>
      <form
        noValidate
        onSubmit={handleSubmit(submit, () => toast.error("Corrija os campos destacados."))}
        className="space-y-4"
      >
        <IdentificationSection isEdit={isEdit} />
        <ContactSection />
        <FormActions isSubmitting={isSubmitting}>
          <Button type="button" variant="secondary" onClick={() => router.push("/persons")}>
            Cancelar
          </Button>
        </FormActions>
      </form>
    </FormProvider>
  );
}
