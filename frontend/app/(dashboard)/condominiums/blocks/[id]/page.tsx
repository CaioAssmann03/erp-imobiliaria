import type { Metadata } from "next";

import { BlockForm } from "@/app/(dashboard)/condominiums/_components/blocks/BlockForm";
import { BlockHeader } from "@/app/(dashboard)/condominiums/_components/blocks/BlockHeader";

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
