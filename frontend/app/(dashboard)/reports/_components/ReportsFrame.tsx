"use client";

import { usePathname } from "next/navigation";

import { reportsFrameState } from "@/lib/reports/report-catalog";
import { cn } from "@/lib/utils";

import { ReportsList } from "./ReportsList";

/**
 * Client Component: a moldura de Relatórios, no desenho dos cadastros: a lista de relatórios à esquerda (continua montada ao trocar de
 * relatório) e o aberto no meio. No celular, a lista e o relatório são telas separadas.
 */
export function ReportsFrame({ children }: { children: React.ReactNode }) {
  const state = reportsFrameState(usePathname());
  if (!state.hasFrame) return <>{children}</>;

  return (
    <div className="lg:flex lg:items-start lg:gap-8 2xl:gap-12">
      <ReportsList openHref={state.openHref} className={state.showListOnPhone ? "flex" : "hidden lg:flex"} />
      <div className={cn("min-w-0 flex-1", !state.showPageOnPhone && "hidden lg:block")}>{children}</div>
    </div>
  );
}
