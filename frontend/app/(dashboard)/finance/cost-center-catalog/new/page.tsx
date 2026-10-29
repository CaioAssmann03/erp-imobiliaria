import type { Metadata } from "next";

import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";

import { CatalogItemForm } from "../_components/CatalogItemForm";

export const metadata: Metadata = { title: "Nova sub-conta" };

export default function NewCatalogItemPage() {
  return (
    <FormPage>
      <PageHeader back={{ href: "/finance/cost-center-catalog", label: "Catálogo de sub-contas" }} title="Nova sub-conta" />
      <CatalogItemForm />
    </FormPage>
  );
}
