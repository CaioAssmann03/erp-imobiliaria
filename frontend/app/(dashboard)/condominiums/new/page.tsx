import type { Metadata } from "next";
import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";
import { CondominiumForm } from "../_components/CondominiumForm";

export const metadata: Metadata = { title: "Novo condomínio" };

export default function NewCondominiumPage() {
  return (
    <FormPage>
      <PageHeader
        back={{ href: "/condominiums", label: "Condomínios" }}
        title="Novo condomínio"
      />
      <CondominiumForm />
    </FormPage>
  );
}
