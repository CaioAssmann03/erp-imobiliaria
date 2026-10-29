import type { Metadata } from "next";

import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";

import { CatalogItemForm } from "../_components/CatalogItemForm";

export const metadata: Metadata = { title: "Editar sub-conta" };

export default async function EditCatalogItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <FormPage>
      <PageHeader back={{ href: "/finance/cost-center-catalog", label: "Catálogo de sub-contas" }} title="Editar sub-conta" />
      <CatalogItemForm itemId={id} />
    </FormPage>
  );
}
