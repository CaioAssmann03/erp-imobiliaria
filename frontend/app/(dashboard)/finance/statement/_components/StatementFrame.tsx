"use client";

import { usePathname } from "next/navigation";

import { RegistryFrame } from "@/components/layout/RegistryFrame";
import { statementFrameState } from "@/lib/finance/statement-workspace";

import { StatementList } from "./StatementList";
import { StatementSideMenu } from "./StatementSideMenu";

/** Client Component: a moldura do extrato: a lista de condomínios (com o saldo de cada um), o extrato do escolhido e o índice de seções (`statementFrameState`); a tela vazia ocupa a largura toda. */
export function StatementFrame({ children }: { children: React.ReactNode }) {
  const state = statementFrameState(usePathname());
  if (!state.hasFrame) return <>{children}</>;

  return (
    <RegistryFrame
      list={(className) => (<StatementList openCondominiumId={state.condominiumId} className={className} />)}
      aside={state.condominiumId ? <StatementSideMenu condominiumId={state.condominiumId} /> : undefined}
      showListOnPhone={state.showListOnPhone}
      showPageOnPhone={state.showPageOnPhone}
    >
      {children}
    </RegistryFrame>
  );
}
