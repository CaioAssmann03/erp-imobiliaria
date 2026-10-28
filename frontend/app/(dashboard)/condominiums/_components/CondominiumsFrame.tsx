"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";

import { isRegistryPath } from "@/lib/condominium-registry";
import { cn } from "@/lib/utils";
import { CondominiumsList } from "./CondominiumsList";

/**
 * Client Component: a moldura do cadastro (lista à esquerda, o condomínio ao lado). Só envolve as telas do cadastro (`isRegistryPath`);
 * as demais (unidades, formulários de bloco e sub-conta) ocupam a largura toda. No celular, a lista e o condomínio são telas separadas.
 */
export function CondominiumsFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (!isRegistryPath(pathname)) return <>{children}</>;

  const hasOpenPage = pathname !== "/condominiums";

  return (
    <div className="lg:flex lg:items-start lg:gap-8">
      <Suspense>
        <CondominiumsList className={hasOpenPage ? "hidden lg:flex" : "flex"} />
      </Suspense>
      <div className={cn("min-w-0 flex-1", !hasOpenPage && "hidden lg:block")}>{children}</div>
    </div>
  );
}
