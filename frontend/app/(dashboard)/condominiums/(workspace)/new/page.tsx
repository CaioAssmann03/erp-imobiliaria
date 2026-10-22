import type { Metadata } from "next";

import { getMapsEmbedKey } from "@/lib/maps-embed-key";

import { CondominiumForm } from "../../_components/CondominiumForm";
import { BackToList } from "../../_components/workspace/BackToList";

export const metadata: Metadata = { title: "Novo condomínio" };

export default function NewCondominiumPage() {
  return (
    <div className="space-y-4">
      <BackToList />
      <h2 className="text-title">Novo condomínio</h2>
      <CondominiumForm mapsEmbedKey={getMapsEmbedKey()} />
    </div>
  );
}
