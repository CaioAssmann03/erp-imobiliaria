"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, ArrowUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { SearchField } from "@/components/data-list";
import { FilterMenu } from "@/components/FilterMenu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CondominiumListState } from "@/hooks/use-condominium-list";
import { getCondominiumsListQueryOptions } from "@/lib/api/generated";
import type { CondominiumsListOrdering } from "@/lib/api/generated/models";
import { CONDOMINIUM_PENDING_OPTIONS, codeFromInput } from "@/lib/condominium-list";

const SORT_OPTIONS: readonly { value: CondominiumsListOrdering; label: string }[] = [
  { value: "code", label: "Código, do menor ao maior" },
  { value: "-code", label: "Código, do maior ao menor" },
  { value: "name", label: "Nome, de A a Z" },
  { value: "-name", label: "Nome, de Z a A" },
];

const TYPE_OPTIONS = [
  { value: "residential", label: "Residencial" },
  { value: "commercial", label: "Comercial" },
];

const FIELD_CLASS =
  "h-9 min-w-0 flex-1 rounded-control bg-ink/5 px-3 text-body outline-none transition-colors placeholder:text-ink-faint focus-visible:ring-2 focus-visible:ring-brand/50";

/** As ferramentas do painel: ir ao código, busca, ordem, filtros e "ocultar inativos". */
export function CondominiumListTools({ list }: { list: CondominiumListState }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");

  const jumpToCode = async (event: React.FormEvent) => {
    event.preventDefault();
    const wanted = codeFromInput(code);
    if (wanted === null) return toast.error("Digite o código do condomínio.");
    try {
      // O servidor lista primeiro quem tem exatamente esse código (spec 019).
      const page = await queryClient.fetchQuery(getCondominiumsListQueryOptions({ query: String(wanted), limit: 1 }));
      const found = page.results[0];
      if (found?.code !== wanted) return toast.error("Nenhum condomínio com esse código.");
      setCode("");
      router.push(`/condominiums/${found.id}`);
    } catch {
      toast.error("Não foi possível buscar o código.");
    }
  };

  return (
    <div className="space-y-2 px-4 pb-3">
      <form onSubmit={jumpToCode} className="flex items-center gap-2" aria-label="Ir para um código">
        <input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          inputMode="numeric"
          autoComplete="off"
          placeholder="Buscar por código"
          aria-label="Buscar por código"
          className={FIELD_CLASS}
        />
        <Button type="submit" variant="secondary" size="icon" aria-label="Abrir o condomínio com esse código" title="Abrir">
          <ArrowRight className="size-4" />
        </Button>
      </form>

      <div className="flex items-center gap-2">
        <SearchField
          placeholder="Buscar por nome ou código"
          aria-label="Buscar por nome ou código"
          value={list.search}
          onChange={(event) => list.setSearch(event.target.value)}
          className={FIELD_CLASS}
        />
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Ordenar a lista"
            title="Ordenar"
            className="flex size-9 shrink-0 items-center justify-center rounded-control text-ink-soft outline-none transition-colors hover:bg-surface-muted hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50"
          >
            <ArrowUpDown aria-hidden className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuRadioGroup
              value={list.ordering}
              onValueChange={(value) => list.setOrdering(value as CondominiumsListOrdering)}
            >
              {SORT_OPTIONS.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterMenu
          onClear={list.clearFilters}
          groups={[
            { key: "type", label: "Tipo", value: list.type, onChange: list.setType, options: TYPE_OPTIONS },
            { key: "pending", label: "Pendência", value: list.pending, onChange: list.setPending, options: CONDOMINIUM_PENDING_OPTIONS },
          ]}
        />
        <label className="ml-auto flex cursor-pointer items-center gap-2 text-body text-ink-soft">
          <Checkbox checked={list.hidesInactive} onCheckedChange={(checked) => list.setHidesInactive(checked === true)} />
          Ocultar inativos
        </label>
      </div>
    </div>
  );
}
