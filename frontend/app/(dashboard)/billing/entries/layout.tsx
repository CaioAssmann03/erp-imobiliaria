import { Suspense } from "react";

import { BillingEntriesFrame } from "./_components/BillingEntriesFrame";

/** O escopo (condomínio e mês) viaja na URL e a moldura o lê no cliente: o `Suspense` é o que a página estática exige para isso. */
export default function BillingEntriesLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <BillingEntriesFrame>{children}</BillingEntriesFrame>
    </Suspense>
  );
}
