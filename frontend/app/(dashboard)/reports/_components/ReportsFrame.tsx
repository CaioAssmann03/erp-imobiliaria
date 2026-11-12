"use client";

import { usePathname } from "next/navigation";

import { RegistryFrame } from "@/components/layout/RegistryFrame";
import { reportsFrameState } from "@/lib/reports/report-catalog";

import { ReportsList } from "./ReportsList";

/**
 * Client Component: a moldura de Relatórios, no desenho dos cadastros mas só com duas colunas: a lista de relatórios à esquerda (continua montada ao
 * trocar de relatório) e o aberto no meio, sem menu à direita. No celular, a lista e o relatório são telas separadas.
 */
export function ReportsFrame({ children }: { children: React.ReactNode }) {
  const state = reportsFrameState(usePathname());
  if (!state.hasFrame) return <>{children}</>;

  return (
    <RegistryFrame
      list={(className) => <ReportsList openHref={state.openHref} className={className} />}
      showListOnPhone={state.showListOnPhone}
      showPageOnPhone={state.showPageOnPhone}
    >
      {children}
    </RegistryFrame>
  );
}
