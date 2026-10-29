"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { CondominiumsPane } from "./CondominiumsPane";

/**
 * Client Component: moldura de duas colunas das telas de Condomínios (lista à esquerda, conteúdo à direita; as
 * abas das seções ficam no layout de `[id]`). A lista fica montada ao trocar de condomínio: só o conteúdo muda. No celular mostra uma coisa por vez: a lista em `/condominiums`, o conteúdo nas demais.
 */
export function CondominiumsWorkspace({ children }: { children: React.ReactNode }) {
  const isIndex = usePathname() === "/condominiums";

  return (
    <div className="lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-8">
      <aside
        className={cn(
          "lg:sticky lg:top-4 lg:block lg:h-[calc(100vh-9rem)] lg:self-start",
          !isIndex && "hidden"
        )}
      >
        <Suspense fallback={<Skeleton className="h-full min-h-40 w-full" />}>
          <CondominiumsPane />
        </Suspense>
      </aside>
      <div className={cn("min-w-0", isIndex && "hidden lg:block")}>{children}</div>
    </div>
  );
}
