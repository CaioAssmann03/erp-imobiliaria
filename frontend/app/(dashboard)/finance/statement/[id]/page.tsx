import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { uuidParam } from "@/lib/api/uuid-param";

import { StatementHeader } from "../_components/StatementHeader";
import { StatementView } from "../_components/StatementView";

export const metadata: Metadata = { title: "Extrato" };

export default async function CondominiumStatementPage({ params }: { params: Promise<{ id: string }> }) {
  const id = uuidParam((await params).id);
  if (!id) notFound();

  return (
    <>
      <StatementHeader condominiumId={id} />
      {/* A chave zera a busca, os filtros e a página ao trocar de condomínio. */}
      <StatementView key={id} condominiumId={id} />
    </>
  );
}
