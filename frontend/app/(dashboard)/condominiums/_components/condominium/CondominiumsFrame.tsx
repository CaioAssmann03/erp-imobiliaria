"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";

import { RegistryFrame } from "@/components/layout/RegistryFrame";
import { registryLayout, selectedCondominiumId, selectedCondominiumPage } from "@/lib/condominiums/condominium-registry";

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

  return (
    <RegistryFrame
      list={(className) => (
        <Suspense>
          <CondominiumsList className={className} />
        </Suspense>
      )}
      aside={condominiumId ? <CondominiumSideMenu condominiumId={condominiumId} current={selectedCondominiumPage(pathname) ?? undefined} /> : undefined}
      showListOnPhone={showListOnPhone}
      showPageOnPhone={showPageOnPhone}
    >
      {children}
    </RegistryFrame>
  );
}
