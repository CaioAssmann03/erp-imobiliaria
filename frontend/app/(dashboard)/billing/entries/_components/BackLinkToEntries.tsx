"use client";

import { PhoneBackLink } from "@/components/layout/BackLink";
import { billingEntriesUrl } from "@/lib/billing/billing-entry-workspace";

import { useEntriesScope } from "./use-entries-scope";

/** O "voltar" à lista, só no celular (onde a lista não fica ao lado), mantendo o condomínio e o mês. */
export function BackLinkToEntries() {
  return (
    <PhoneBackLink href={billingEntriesUrl(useEntriesScope())} label="Inclusão de valores" />
  );
}
