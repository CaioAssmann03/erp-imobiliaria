import { Button } from "@/components/ui/button";
import { PAGE_SIZE_OPTIONS } from "@/lib/pagination";

interface PaginationProps {
  page: number;
  limit: number;
  count: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

/** Rodapé de tabela, discreto: faixa exibida à esquerda; tamanho da página e navegação à direita. */
export function Pagination({ page, limit, count, onPageChange, onLimitChange }: PaginationProps) {
  if (count === 0) return null;

  const totalPages = Math.max(1, Math.ceil(count / limit));
  const first = (page - 1) * limit + 1;
  const last = Math.min(page * limit, count);

  return (
    <div className="mt-2 flex items-center justify-between gap-3 px-3 pb-1 text-caption text-ink-soft">
      <span className="tabular-nums">
        {first}–{last} de {count}
      </span>

      <div className="flex items-center gap-1">
        <select
          aria-label="Itens por página"
          value={limit}
          onChange={(event) => onLimitChange(Number(event.target.value))}
          className="h-7 cursor-pointer rounded-full bg-transparent px-2.5 text-caption text-ink-soft outline-none transition-colors hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size} por página
            </option>
          ))}
        </select>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Página anterior"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          ‹
        </Button>
        <span className="min-w-10 text-center tabular-nums">
          {page} / {totalPages}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Próxima página"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          ›
        </Button>
      </div>
    </div>
  );
}
