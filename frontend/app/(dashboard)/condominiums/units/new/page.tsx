import type { Metadata } from "next";

import { NewUnitForm } from "../../_components/NewUnitForm";
import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Nova unidade" };

export default function NewUnitFromListPage() {
  return (
    <FormPage>
      <PageHeader back={{ href: "/condominiums/units", label: "Unidades" }} title="Nova unidade" />
      <NewUnitForm />
    </FormPage>
  );
}
