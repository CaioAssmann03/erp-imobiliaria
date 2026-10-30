import type { Metadata } from "next";

import { BlockForm } from "@/app/(dashboard)/condominiums/_components/blocks/BlockForm";
import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = { title: "Novo bloco" };

export default function NewBlockPage() {
  return (
    <FormPage>
      <PageHeader back={{ href: "/condominiums", label: "Condomínios" }} title="Novo bloco" />
      <BlockForm />
    </FormPage>
  );
}
