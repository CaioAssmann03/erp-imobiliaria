import type { Metadata } from "next";

import { BlockForm } from "../../_components/BlockForm";
import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Novo bloco" };

export default function NewBlockPage() {
  return (
    <FormPage>
      <PageHeader back={{ href: "/condominiums", label: "Condomínios" }} title="Novo bloco" />
      <BlockForm />
    </FormPage>
  );
}
