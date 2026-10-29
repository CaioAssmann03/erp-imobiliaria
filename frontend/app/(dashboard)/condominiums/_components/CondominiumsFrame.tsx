"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";

import { registryLayout } from "@/lib/condominium-registry";
import { cn } from "@/lib/utils";
import { CondominiumsList } from "./CondominiumsList";

/**
 * Client Component: a moldura do cadastro (lista à esquerda, o condomínio ao lado). Só envolve as telas do cadastro (`isRegistryPath`);
 * as demais (unidades, formulários de bloco e sub-conta) ocupam a largura toda. No celular, a lista e o condomínio são telas separadas.
 */
export function CondominiumsFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { hasFrame, showListOnPhone, showPageOnPhone } = registryLayout(pathname);
  if (!hasFrame) return <>{children}</>;

  return (
    <div className="lg:flex lg:items-start lg:gap-8 2xl:gap-12">
      <Suspense>
        <CondominiumsList className={showListOnPhone ? "flex" : "hidden lg:flex"} />
      </Suspense>
      <div className={cn("min-w-0 flex-1", !showPageOnPhone && "hidden lg:block")}>{children}</div>
    </div>
  );
}
