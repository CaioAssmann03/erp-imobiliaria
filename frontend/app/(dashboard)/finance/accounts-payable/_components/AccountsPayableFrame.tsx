"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";

import { RegistryFrame } from "@/components/layout/RegistryFrame";
import { accountsPayableFrameState } from "@/lib/finance/account-payable-workspace";

import { AccountPayableSideMenu } from "./AccountPayableSideMenu";
import { AccountsPayableList } from "./AccountsPayableList";

/** Client Component: a moldura das contas a pagar: a lista à esquerda, a conta aberta no meio e o índice de seções à direita (`accountsPayableFrameState`); a tela vazia ocupa a largura toda. */
export function AccountsPayableFrame({ children }: { children: React.ReactNode }) {
  const state = accountsPayableFrameState(usePathname());
  if (!state.hasFrame) return <>{children}</>;

  return (
    <RegistryFrame
      list={(className) => (
        <Suspense fallback={null}>
          <AccountsPayableList openAccountId={state.accountId} className={className} />
        </Suspense>
      )}
      aside={state.isNew || state.accountId !== null ? <AccountPayableSideMenu accountId={state.accountId} /> : undefined}
      showListOnPhone={state.showListOnPhone}
      showPageOnPhone={state.showPageOnPhone}
    >
      {children}
    </RegistryFrame>
  );
}
