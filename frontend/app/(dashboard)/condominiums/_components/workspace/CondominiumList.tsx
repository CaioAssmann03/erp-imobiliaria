"use client";

import { Plus } from "lucide-react";
import { useParams, usePathname } from "next/navigation";

import { LinkButton } from "@/components/LinkButton";
import { useCondominiumList } from "@/hooks/use-condominium-list";
import { condominiumTotalLabel } from "@/lib/condominium-list";
import { cn } from "@/lib/utils";

import { CondominiumListRows } from "./CondominiumListRows";
import { CondominiumListTools } from "./CondominiumListTools";

/**
 * O painel da esquerda do cadastro (spec 038): a lista dos condomínios com busca, ordem, filtros e o total. Fica montado
 * enquanto se passa de um condomínio a outro (está no layout). No celular é uma página própria: aparece só em
 * `/condominiums`; a partir de 1024 px aparece sempre, ao lado do condomínio aberto.
 */
export function CondominiumList() {
  const { id: selectedId } = useParams<{ id?: string }>();
  const pathname = usePathname();
  const list = useCondominiumList();

  return (
    <aside
      aria-label="Lista de condomínios"
      className={cn(
        "min-w-0 flex-col overflow-hidden rounded-card bg-card shadow-card lg:sticky lg:top-4 lg:flex lg:max-h-[calc(100vh-2rem)]",
        pathname === "/condominiums" ? "flex" : "hidden",
      )}
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <h2 className="text-heading">Condomínios</h2>
        <LinkButton href="/condominiums/new" variant="ghost" size="sm" className="gap-1 text-ink-soft hover:text-ink">
          <Plus aria-hidden className="size-4" />
          Novo
        </LinkButton>
      </div>
      <CondominiumListTools list={list} />
      <CondominiumListRows list={list} selectedId={selectedId} />
      {list.total !== undefined && (
        <p className="border-t border-border px-4 py-3 text-caption text-ink-soft tabular-nums">
          {condominiumTotalLabel(list.total, list.hidesInactive)}
        </p>
      )}
    </aside>
  );
}
