"use client";

import { Search } from "lucide-react";

import { useIsApplePlatform } from "@/hooks/use-platform";
import { searchShortcutLabel } from "@/lib/navigation/platform";
import { cn } from "@/lib/utils";

import { railButtonClass, RailLabel } from "@/app/(dashboard)/_components/shell/menu/ModuleMenu";
import { requestOpenSearch } from "./open-search-event";

/**
 * O botão da busca global na rail, logo acima das configurações: a lupa com o atalho (embaixo dela, na rail recolhida; ao lado do nome,
 * na expandida). Clicar abre o mesmo painel no meio da tela que o atalho de teclado (`GlobalSearch`).
 */
export function SearchRailButton({ expanded }: { expanded: boolean }) {
  const shortcut = searchShortcutLabel(useIsApplePlatform());

  return (
    <button
      type="button"
      onClick={requestOpenSearch}
      title={`Buscar (${shortcut})`}
      aria-label="Abrir busca"
      className={cn(railButtonClass(false, false, expanded), !expanded && "h-auto flex-col gap-0.5 py-2")}
    >
      <Search className="size-5 shrink-0" />
      {expanded ? (
        <>
          <RailLabel>Buscar</RailLabel>
          <kbd className="ml-auto rounded-md bg-ink/5 px-1.5 py-0.5 text-caption">{shortcut}</kbd>
        </>
      ) : (
        <kbd className="text-[0.625rem] leading-none font-medium">{shortcut}</kbd>
      )}
    </button>
  );
}
