import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { uuidParam } from "@/lib/api/uuid-param";

import { CompanyEntryHeader } from "../_components/CompanyEntryHeader";
import { CompanyEntryView } from "../_components/CompanyEntryView";

export const metadata: Metadata = { title: "Lançamento da imobiliária" };

export default async function CompanyEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const id = uuidParam((await params).id);
  if (!id) notFound();

  return (
    <>
      <CompanyEntryHeader entryId={id} />
      <CompanyEntryView entryId={id} />
    </>
  );
}
