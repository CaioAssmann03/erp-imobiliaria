"use client";

import { usePathname } from "next/navigation";

import { personsFrameState } from "@/lib/person-workspace";
import { cn } from "@/lib/utils";
import { PersonsList } from "./PersonsList";

/**
 * Client Component: a moldura do cadastro de pessoas (a lista à esquerda, a pessoa aberta ao lado, o índice de seções à direita, como em
 * condomínios). Só envolve as telas do cadastro (`personsFrameState`). No celular, a lista e a pessoa aberta são telas separadas.
 */
export function PersonsFrame({ children }: { children: React.ReactNode }) {
  const state = personsFrameState(usePathname());
  if (!state.hasFrame) return <>{children}</>;

  return (
    <div className="lg:flex lg:items-start lg:gap-8 2xl:gap-12">
      <PersonsList openPersonId={state.personId} className={state.showListOnPhone ? "flex" : "hidden lg:flex"} />
      <div className={cn("min-w-0 flex-1", !state.showPageOnPhone && "hidden lg:block")}>{children}</div>
    </div>
  );
}
