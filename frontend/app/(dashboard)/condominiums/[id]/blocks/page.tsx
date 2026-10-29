import type { Metadata } from "next";
import { Suspense } from "react";

import { BlocksRegistryList } from "../../_components/BlocksRegistryList";
import { CondominiumHeader } from "../../_components/CondominiumHeader";
import { CondominiumSideMenu } from "../../_components/CondominiumSideMenu";
import { ListFallback } from "@/components/data-list";
import { FormPage } from "@/components/form/FormPage";

export const metadata: Metadata = { title: "Blocos" };

/** Os blocos de um condomínio, numa tela própria, na lista no padrão da de condomínios (o menu da direita volta aos dados do condomínio); abrir um leva à edição dele. */
export default async function CondominiumBlocksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <FormPage aside={<CondominiumSideMenu condominiumId={id} current="blocks" />}>
      <CondominiumHeader condominiumId={id} />
      <Suspense fallback={<ListFallback />}>
        <BlocksRegistryList condominiumId={id} />
      </Suspense>
    </FormPage>
  );
}
