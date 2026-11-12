import { Search } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Uma sub-tela de um registro, a mesma em todo módulo: o título (com `actions`, em geral o **+**), um cartão branco com a busca em pílula (e, se
 * houver, o filtro compacto em `filter` e um seletor de escopo em `above`), os esqueletos, a mensagem de vazio, as linhas (`children`, só
 * `RegistryListItem onCard`) e, em `footer`, o "Mostrar mais". É a versão do meio da página do `RegistryList` (a coluna da esquerda).
 */
export function RegistrySubList({
  label,
  title,
  actions,
  search,
  above,
  filter,
  navLabel,
  isLoading,
  isPlaceholderData = false,
  isEmpty,
  emptyMessage,
  skeletonRows = 4,
  skeletonClassName = "h-12",
  footer,
  children,
}: {
  label: string;
  title: string;
  actions?: React.ReactNode;
  search: { label: string; placeholder: string; value: string; onChange: (value: string) => void };
  above?: React.ReactNode;
  filter?: React.ReactNode;
  navLabel: string;
  isLoading: boolean;
  isPlaceholderData?: boolean;
  isEmpty: boolean;
  emptyMessage: string;
  skeletonRows?: number;
  skeletonClassName?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={label} className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="text-heading">{title}</h2>
        {actions}
      </div>

      <div className="flex flex-col gap-3 rounded-card bg-surface p-3 shadow-card">
        {above}
        <div
          className={cn(
            "flex h-10 items-center gap-2 rounded-control bg-surface-muted pl-3 text-ink-soft focus-within:ring-2 focus-within:ring-brand/50",
            filter ? "pr-1.5" : "pr-3"
          )}
        >
          <Search className="size-4 shrink-0" />
          <input
            type="search"
            aria-label={search.label}
            value={search.value}
            onChange={(event) => search.onChange(event.target.value)}
            placeholder={search.placeholder}
            className="min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-faint"
          />
          {filter}
        </div>

        <nav aria-label={navLabel} className={cn("transition-opacity", isPlaceholderData && "opacity-60")}>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: skeletonRows }, (_, index) => (
                <Skeleton key={index} className={cn("rounded-panel", skeletonClassName)} />
              ))}
            </div>
          ) : isEmpty ? (
            <p className="px-2 py-6 text-center text-body text-ink-soft">{emptyMessage}</p>
          ) : (
            <ul className="space-y-0.5">{children}</ul>
          )}
        </nav>

        {footer}
      </div>
    </section>
  );
}
