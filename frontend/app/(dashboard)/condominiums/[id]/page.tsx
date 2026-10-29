import type { Metadata } from "next";

import { CondominiumForm } from "../_components/CondominiumForm";
import { getMapsEmbedKey } from "@/lib/maps-embed-key";

export const metadata: Metadata = { title: "Editar condomínio" };

export default async function EditCondominiumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <CondominiumForm condominiumId={id} mapsEmbedKey={getMapsEmbedKey()} />;
}
