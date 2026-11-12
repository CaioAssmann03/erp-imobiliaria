import type { Metadata } from "next";
import { Suspense } from "react";

import { PersonForm } from "../_components/PersonForm";
import { PersonHeader } from "../_components/PersonHeader";

export const metadata: Metadata = { title: "Pessoa" };

export default async function EditPersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <Suspense fallback={null}>
        <PersonHeader personId={id} />
      </Suspense>
      <PersonForm personId={id} />
    </>
  );
}
