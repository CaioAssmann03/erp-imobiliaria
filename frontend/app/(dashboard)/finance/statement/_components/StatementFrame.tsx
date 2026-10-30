"use client";

import { usePathname } from "next/navigation";

import { FormPage } from "@/components/form/FormPage";
import { statementFrameState } from "@/lib/statement-workspace";
import { cn } from "@/lib/utils";

import { StatementList } from "./StatementList";
import { StatementSideMenu } from "./StatementSideMenu";

/**
 * Client Component: a moldura do extrato, as 3 colunas das telas do cadastro: a lista de condomínios (com o saldo de cada um) à esquerda, o extrato
 * do escolhido no meio e o índice de seções à direita (os dois são desta moldura, por isso continuam montados ao trocar de condomínio). Só envolve as
 * telas do extrato (`statementFrameState`); a tela vazia ocupa a largura toda. No celular, a lista e o extrato são telas separadas.
 */
export function StatementFrame({ children }: { children: React.ReactNode }) {
  const state = statementFrameState(usePathname());
  if (!state.hasFrame) return <>{children}</>;

  return (
    <div className="lg:flex lg:items-start lg:gap-8 2xl:gap-12">
      <StatementList openCondominiumId={state.condominiumId} className={state.showListOnPhone ? "flex" : "hidden lg:flex"} />
      <div className={cn("min-w-0 flex-1", !state.showPageOnPhone && "hidden lg:block")}>
        {state.condominiumId ? <FormPage aside={<StatementSideMenu condominiumId={state.condominiumId} />}>{children}</FormPage> : children}
      </div>
    </div>
  );
}
