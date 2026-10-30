"use client";

import { BackLink } from "@/components/BackLink";
import { billingEntriesUrl } from "@/lib/billing-entry-workspace";

import { useEntriesScope } from "./use-entries-scope";

/** O "voltar" à lista, só no celular (onde a lista não fica ao lado), mantendo o condomínio e o mês. */
export function BackLinkToEntries() {
  return (
    <div className="lg:hidden">
      <BackLink href={billingEntriesUrl(useEntriesScope())} label="Inclusão de valores" />
    </div>
  );
}
