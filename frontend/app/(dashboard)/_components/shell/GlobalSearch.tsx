"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { SearchResults } from "./search/SearchResults";
import type { SearchResultItem } from "./search/types";
import { useSearchResults } from "./search/use-search-results";
import { useSearchShortcut } from "./search/use-search-shortcut";

/**
 * Busca global estilo Spotlight: o header tem um botão de vidro e o painel de busca
 * abre centralizado sobre a página (⌘K). Cadastros vêm da API; páginas e gráficos do
 * painel são filtrados no navegador.
 */
export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const { items, searchable, waiting } = useSearchResults(query);
  useSearchShortcut(useCallback(() => setOpen((current) => !current), []));

  const close = () => {
    setOpen(false);
    setQuery("");
    setActive(0);
  };

  const go = (item: SearchResultItem) => {
    close();
    router.push(item.href);
  };

  const count = Math.max(items.length, 1);
  const activeIndex = Math.min(active, count - 1);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((activeIndex + 1) % count);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((activeIndex - 1 + count) % count);
    } else if (event.key === "Enter" && items[activeIndex]) {
      event.preventDefault();
      go(items[activeIndex]);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (next) setOpen(true);
        else close();
      }}
    >
      <Dialog.Trigger
        className="flex size-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-surface hover:text-ink lg:glass-pill lg:h-11 lg:w-full lg:justify-between lg:px-5 lg:text-left lg:text-[0.9375rem]"
        aria-label="Abrir busca"
      >
        <Search className="size-5 lg:hidden" />
        <span className="hidden truncate lg:inline">Buscar…</span>
        <kbd className="hidden rounded-md bg-ink/5 px-1.5 py-0.5 text-caption lg:inline">⌘K</kbd>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-ink/15 backdrop-blur-sm transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="glass fixed top-[8vh] left-1/2 z-50 w-[min(40rem,94vw)] sm:top-[14vh] -translate-x-1/2 overflow-hidden rounded-[1.75rem] outline-none transition duration-200 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
          <Dialog.Title className="sr-only">Busca</Dialog.Title>
          <input
            type="text"
            value={query}
            autoFocus
            placeholder="Buscar pessoas, condomínios, unidades, IDs, gráficos…"
            aria-label="Busca global"
            autoComplete="off"
            className="h-14 w-full bg-transparent px-6 text-[1.0625rem] text-ink outline-none placeholder:text-ink-soft/70"
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={handleKeyDown}
          />

          {query.trim().length > 0 && (
            <div className="max-h-[52vh] overflow-auto px-2 pb-2">
              <SearchResults
                items={items}
                query={query}
                searchable={searchable}
                waiting={waiting}
                activeIndex={activeIndex}
                onHover={setActive}
                onSelect={go}
              />
            </div>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
