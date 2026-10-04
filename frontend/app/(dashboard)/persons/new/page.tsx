import type { Metadata } from "next";
import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";
import { PersonForm } from "../_components/PersonForm";

export const metadata: Metadata = { title: "Nova pessoa" };

export default function NewPersonPage() {
  return (
    <FormPage>
      <PageHeader back={{ href: "/persons", label: "Pessoas" }} title="Nova pessoa" />
      <PersonForm />
    </FormPage>
  );
}
