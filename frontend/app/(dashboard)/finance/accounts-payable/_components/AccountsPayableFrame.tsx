"use client";

import { usePathname } from "next/navigation";

import { FormPage } from "@/components/form/FormPage";
import { accountsPayableFrameState } from "@/lib/account-payable-workspace";
import { cn } from "@/lib/utils";

import { AccountPayableSideMenu } from "./AccountPayableSideMenu";
import { AccountsPayableList } from "./AccountsPayableList";

/**
 * Client Component: a moldura das contas a pagar, as 3 colunas das telas do cadastro: a lista à esquerda, a conta aberta no meio e o índice de
 * seções à direita (os dois são desta moldura, por isso continuam montados ao trocar de conta). Só envolve as telas das contas
 * (`accountsPayableFrameState`); a tela vazia ocupa a largura toda. No celular, a lista e a conta aberta são telas separadas.
 */
export function AccountsPayableFrame({ children }: { children: React.ReactNode }) {
  const state = accountsPayableFrameState(usePathname());
  if (!state.hasFrame) return <>{children}</>;

  const hasAccount = state.isNew || state.accountId !== null;

  return (
    <div className="lg:flex lg:items-start lg:gap-8 2xl:gap-12">
      <AccountsPayableList openAccountId={state.accountId} className={state.showListOnPhone ? "flex" : "hidden lg:flex"} />
      <div className={cn("min-w-0 flex-1", !state.showPageOnPhone && "hidden lg:block")}>
        {hasAccount ? <FormPage aside={<AccountPayableSideMenu accountId={state.accountId} />}>{children}</FormPage> : children}
      </div>
    </div>
  );
}
