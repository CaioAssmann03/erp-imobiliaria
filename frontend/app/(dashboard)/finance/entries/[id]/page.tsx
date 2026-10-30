import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { uuidParam } from "@/lib/api/uuid-param";

import { EntryBatchHeader } from "../_components/EntryBatchHeader";
import { EntryBatchView } from "../_components/EntryBatchView";

export const metadata: Metadata = { title: "Lote" };

export default async function EntryBatchPage({ params }: { params: Promise<{ id: string }> }) {
  const id = uuidParam((await params).id);
  if (!id) notFound();

  return (
    <>
      <EntryBatchHeader batchId={id} />
      <EntryBatchView batchId={id} />
    </>
  );
}
