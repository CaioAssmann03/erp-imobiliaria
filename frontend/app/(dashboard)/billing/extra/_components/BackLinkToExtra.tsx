"use client";

import { BackLink } from "@/components/layout/BackLink";
import { extraBillingUrl } from "@/lib/billing/extra-billing-workspace";

import { useExtraScope } from "./use-extra-scope";

/** No celular, onde a lista não fica ao lado, o "voltar" à lista dos boletos extras no alto da tela. */
export function BackLinkToExtra() {
  const scope = useExtraScope();

  return (
    <div className="lg:hidden">
      <BackLink href={extraBillingUrl(scope)} label="Boleto extra" />
    </div>
  );
}
