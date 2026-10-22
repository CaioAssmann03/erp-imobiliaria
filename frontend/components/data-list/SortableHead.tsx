import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import { TableHead } from "@/components/ui/table";
import type { SortDirection, SortState } from "@/lib/list-sort";
import { cn } from "@/lib/utils";

const ARIA_SORT = { asc: "ascending", desc: "descending" } as const satisfies Record<SortDirection, string>;
const DIRECTION_ICON = { asc: ArrowUp, desc: ArrowDown } as const satisfies Record<SortDirection, unknown>;

interface SortableHeadProps<Column extends string> {
  column: Column;
  sort: SortState<Column>;
  onSort: (column: Column) => void;
  className?: string;
  children: React.ReactNode;
}

/**
 * Cabeçalho de coluna que ordena a listagem ao clicar. O sentido vai em `aria-sort` na célula e na seta do botão;
 * as colunas que não estão ordenadas mostram uma seta dupla apagada, só para indicar que dá para clicar.
 */
export function SortableHead<Column extends string>({
  column,
  sort,
  onSort,
  className,
  children,
}: SortableHeadProps<Column>) {
  const isSorted = sort.column === column;
  const Icon = isSorted ? DIRECTION_ICON[sort.direction] : ChevronsUpDown;

  return (
    <TableHead className={className} aria-sort={isSorted ? ARIA_SORT[sort.direction] : "none"}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          "-mx-1.5 inline-flex cursor-pointer items-center gap-1 rounded-control px-1.5 py-1 outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50",
          isSorted && "text-ink",
        )}
      >
        {children}
        <Icon aria-hidden className={cn("size-3.5", !isSorted && "opacity-50")} />
      </button>
    </TableHead>
  );
}
