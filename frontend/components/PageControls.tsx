import { Button } from "@/components/ui/button";

/**
 * O rodapé de uma lista paginada: "1–7 de 20" à esquerda e, à direita, o que vier em `children` (ex.: o seletor de itens por página) e as setas com
 * "página / total". Só desenha; quem usa decide quando mostrá-lo (ver `ReportPager`).
 */
export function PageControls({
  page,
  pageCount,
  pageSize,
  count,
  onPage,
  children,
}: {
  page: number;
  pageCount: number;
  pageSize: number;
  count: number;
  onPage: (page: number) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 pb-1 text-caption text-ink-soft">
      <span className="tabular-nums">
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, count)} de {count}
      </span>
      <div className="flex items-center gap-1">
        {children}
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Página anterior" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          ‹
        </Button>
        <span className="min-w-12 text-center tabular-nums">
          {page} / {pageCount}
        </span>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Próxima página" disabled={page >= pageCount} onClick={() => onPage(page + 1)}>
          ›
        </Button>
      </div>
    </div>
  );
}
