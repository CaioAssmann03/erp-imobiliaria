import { MIN_TEXT_LENGTH } from "@/lib/navigation/search-index";
import { cn } from "@/lib/utils";

import type { SearchResultItem } from "./types";

interface SearchResultsProps {
  items: SearchResultItem[];
  query: string;
  searchable: boolean;
  waiting: boolean;
  activeIndex: number;
  onHover: (index: number) => void;
  onSelect: (item: SearchResultItem) => void;
}

export function SearchResults({
  items,
  query,
  searchable,
  waiting,
  activeIndex,
  onHover,
  onSelect,
}: SearchResultsProps) {
  if (items.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-ink-soft">
        {!searchable
          ? `Digite ao menos ${MIN_TEXT_LENGTH} letras ou o número (ID) do cadastro para buscar.`
          : waiting
            ? "Buscando…"
            : `Nenhum resultado para “${query.trim()}”`}
      </p>
    );
  }

  return (
    <>
      {items.map((item, index) => {
        const showGroup = index === 0 || items[index - 1].group !== item.group;
        return (
          <div key={item.key}>
            {showGroup && (
              <div className="px-4 pt-3 pb-1 text-caption font-medium text-ink-soft">{item.group}</div>
            )}
            <button
              type="button"
              className={cn(
                "block w-full rounded-control px-4 py-2 text-left transition-colors",
                index === activeIndex ? "bg-ink/[0.07]" : "hover:bg-ink/[0.04]"
              )}
              onMouseEnter={() => onHover(index)}
              onClick={() => onSelect(item)}
            >
              <div className="truncate font-medium">{item.title}</div>
              {item.subtitle && <div className="truncate text-caption text-ink-soft">{item.subtitle}</div>}
            </button>
          </div>
        );
      })}
      {waiting && <p className="px-4 pt-1 pb-2 text-caption text-ink-soft">Atualizando…</p>}
    </>
  );
}
