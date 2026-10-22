"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { LinkButton } from "@/components/LinkButton";

/**
 * O que `/condominiums` mostra ao lado da lista: a partir de 1024 px abre o primeiro condomínio (como a Sami); sem nenhum
 * cadastrado, convida a criar o primeiro. No celular a lista ocupa a tela e este bloco não aparece.
 */
export function OpenFirstCondominium({ firstId }: { firstId?: string }) {
  const router = useRouter();

  useEffect(() => {
    if (firstId && window.matchMedia("(min-width: 1024px)").matches) router.replace(`/condominiums/${firstId}`);
  }, [firstId, router]);

  return (
    <div className="hidden rounded-card bg-card p-10 text-center shadow-card lg:block">
      {firstId ? (
        <p className="text-body text-ink-soft">Abrindo o primeiro condomínio…</p>
      ) : (
        <>
          <p className="text-heading">Nenhum condomínio cadastrado</p>
          <p className="mt-1 mb-4 text-body text-ink-soft">Cadastre o primeiro para começar.</p>
          <LinkButton href="/condominiums/new">Novo condomínio</LinkButton>
        </>
      )}
    </div>
  );
}
