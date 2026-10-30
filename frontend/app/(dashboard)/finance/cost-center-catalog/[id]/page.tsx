import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { uuidParam } from "@/lib/uuid-param";

import { CatalogHeader } from "../_components/CatalogHeader";
import { CatalogItemForm } from "../_components/CatalogItemForm";

export const metadata: Metadata = { title: "Sub-conta" };

export default async function EditCatalogItemPage({ params }: { params: Promise<{ id: string }> }) {
  const id = uuidParam((await params).id);
  if (!id) notFound();

  return (
    <>
      <CatalogHeader itemId={id} />
      <CatalogItemForm itemId={id} />
    </>
  );
}
