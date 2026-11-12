import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { uuidParam } from "@/lib/api/uuid-param";

import { BillingEntryHeader } from "../_components/BillingEntryHeader";
import { BillingEntryView } from "../_components/BillingEntryView";

export const metadata: Metadata = { title: "Lançamento" };

export default async function BillingEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const id = uuidParam((await params).id);
  if (!id) notFound();

  return (
    <>
      <BillingEntryHeader entryId={id} />
      <BillingEntryView entryId={id} />
    </>
  );
}
