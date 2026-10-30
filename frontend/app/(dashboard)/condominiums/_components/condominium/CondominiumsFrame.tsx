"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";

import { FormPage } from "@/components/form/FormPage";
import { registryLayout, selectedCondominiumId, selectedCondominiumPage } from "@/lib/condominiums/condominium-registry";
import { cn } from "@/lib/utils";
import { CondominiumSideMenu } from "./CondominiumSideMenu";
import { CondominiumsList } from "./CondominiumsList";

/**
 * Client Component: a moldura do cadastro (lista à esquerda, o condomínio ao lado). Só envolve as telas do cadastro (`isRegistryPath`);
 * as demais (unidades, formulários de bloco e sub-conta) ocupam a largura toda. No celular, a lista e o condomínio são telas separadas.
 */
export function CondominiumsFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { hasFrame, showListOnPhone, showPageOnPhone } = registryLayout(pathname);
  if (!hasFrame) return <>{children}</>;

  // O menu da direita é desta moldura (layout): ao trocar de tela do condomínio ele continua o mesmo, só muda o item aberto.
  const condominiumId = selectedCondominiumId(pathname);
  const content = condominiumId ? (
    <FormPage aside={<CondominiumSideMenu condominiumId={condominiumId} current={selectedCondominiumPage(pathname) ?? undefined} />}>{children}</FormPage>
  ) : (
    children
  );

  return (
    <div className="lg:flex lg:items-start lg:gap-8 2xl:gap-12">
      <Suspense>
        <CondominiumsList className={showListOnPhone ? "flex" : "hidden lg:flex"} />
      </Suspense>
      <div className={cn("min-w-0 flex-1", !showPageOnPhone && "hidden lg:block")}>{content}</div>
    </div>
  );
}
