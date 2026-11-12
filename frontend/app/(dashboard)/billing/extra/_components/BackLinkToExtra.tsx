"use client";

import { PhoneBackLink } from "@/components/layout/BackLink";
import { extraBillingUrl } from "@/lib/billing/extra-billing-workspace";

import { useExtraScope } from "./use-extra-scope";

/** No celular, onde a lista não fica ao lado, o "voltar" à lista dos boletos extras no alto da tela. */
export function BackLinkToExtra() {
  const scope = useExtraScope();

  return (
    <PhoneBackLink href={extraBillingUrl(scope)} label="Boleto extra" />
  );
}
