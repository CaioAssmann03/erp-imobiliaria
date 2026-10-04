"use client";

import { Dialog } from "@base-ui/react/dialog";
import { keepPreviousData } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useBuscaRetrieve } from "@/lib/api/generated";
import { isSearchable, MIN_TEXT_LENGTH, searchStatic } from "@/lib/search-index";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 250;

interface ResultItem {
  key: string;
  group: string;
  title: string;
  subtitle?: string;
  href: string;
}

/**
 * Busca global estilo Spotlight: o header tem um botão de vidro e o painel de busca
 * abre centralizado sobre a página (⌘K). Dados do servidor via TanStack Query (cache por termo,
 * requisição anterior cancelada ao continuar digitando); páginas e gráficos do
 * painel são filtrados no navegador, sem ir à API.
 */
export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const term = useDebouncedValue(query.trim(), DEBOUNCE_MS);
  const enabled = isSearchable(term);

  const { data, isFetching } = useBuscaRetrieve(
    { q: term },
    { query: { enabled, placeholderData: keepPreviousData, staleTime: 30_000 } }
  );

  const items = useMemo<ResultItem[]>(() => {
    const result: ResultItem[] = [];
    if (enabled && data) {
      for (const p of data.pessoas) {
        result.push({ key: `p${p.id}`, group: "Pessoas", title: p.nome, subtitle: p.cpf_cnpj, href: `/pessoas/${p.id}` });
      }
      for (const c of data.condominios) {
        result.push({
          key: `c${c.id}`,
          group: "Condomínios",
          title: c.nome,
          subtitle: c.cidade ? `${c.cidade}/${c.uf}` : (c.cnpj ?? undefined),
          href: `/condominios/${c.id}`,
        });
      }
      for (const u of data.unidades) {
        result.push({
          key: `u${u.id}`,
          group: "Unidades",
          title: `Unidade ${u.nome_unidade}`,
          subtitle: u.condominio_nome,
          href: `/condominios/${u.condominio}/unidades/${u.id}`,
        });
      }
    }
    // Páginas e gráficos: instantâneo, filtra o texto digitado (sem esperar o debounce).
    for (const s of searchStatic(query)) {
      result.push({ key: s.href, group: "Páginas e gráficos", title: s.title, subtitle: s.subtitle, href: s.href });
    }
    return result;
  }, [data, enabled, query]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const close = () => {
    setOpen(false);
    setQuery("");
    setActive(0);
  };

  const go = (item: ResultItem) => {
    close();
    router.push(item.href);
  };

  const activeIndex = Math.min(active, Math.max(items.length - 1, 0));
  const hasQuery = query.trim().length > 0;
  const searchable = isSearchable(query);
  const waiting = searchable && (isFetching || query.trim() !== term);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((activeIndex + 1) % Math.max(items.length, 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((activeIndex - 1 + items.length) % Math.max(items.length, 1));
    } else if (event.key === "Enter" && items[activeIndex]) {
      event.preventDefault();
      go(items[activeIndex]);
    }
  };

  let lastGroup = "";

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
        <Dialog.Popup
          className="glass fixed top-[8vh] left-1/2 z-50 w-[min(40rem,94vw)] sm:top-[14vh] -translate-x-1/2 overflow-hidden rounded-[1.75rem] outline-none transition duration-200 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0"
        >
          <Dialog.Title className="sr-only">Busca</Dialog.Title>
          <input
            type="text"
            value={query}
            autoFocus
            placeholder="Buscar pessoas, condomínios, gráficos…"
            aria-label="Busca global"
            autoComplete="off"
            className="h-14 w-full bg-transparent px-6 text-[1.0625rem] text-ink outline-none placeholder:text-ink-soft/70"
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={handleKeyDown}
          />

          {hasQuery && (
            <div className="max-h-[52vh] overflow-auto px-2 pb-2">
              {items.length === 0 ? (
                <p className="px-4 py-8 text-center text-ink-soft">
                  {!searchable
                    ? `Digite ao menos ${MIN_TEXT_LENGTH} letras (ou 2 números) para buscar cadastros.`
                    : waiting
                      ? "Buscando…"
                      : `Nenhum resultado para “${query.trim()}”`}
                </p>
              ) : (
                items.map((item, index) => {
                  const showGroup = item.group !== lastGroup;
                  lastGroup = item.group;
                  return (
                    <div key={item.key}>
                      {showGroup && (
                        <div className="px-4 pt-3 pb-1 text-caption font-medium text-ink-soft">
                          {item.group}
                        </div>
                      )}
                      <button
                        type="button"
                        className={cn(
                          "block w-full rounded-control px-4 py-2 text-left transition-colors",
                          index === activeIndex ? "bg-ink/[0.07]" : "hover:bg-ink/[0.04]"
                        )}
                        onMouseEnter={() => setActive(index)}
                        onClick={() => go(item)}
                      >
                        <div className="truncate font-medium">{item.title}</div>
                        {item.subtitle && (
                          <div className="truncate text-caption text-ink-soft">{item.subtitle}</div>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
              {items.length > 0 && waiting && (
                <p className="px-4 pt-1 pb-2 text-caption text-ink-soft">Atualizando…</p>
              )}
            </div>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
