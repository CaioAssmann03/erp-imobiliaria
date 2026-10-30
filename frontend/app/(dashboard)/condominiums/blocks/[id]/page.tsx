import type { Metadata } from "next";

import { BlockForm } from "../../_components/BlockForm";
import { BlockHeader } from "../../_components/BlockHeader";

export const metadata: Metadata = { title: "Bloco" };

export default async function EditBlockPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <BlockHeader blockId={id} />
      <BlockForm blockId={id} />
    </>
  );
}
