import { PageControls } from "@/components/PageControls";

/** Quantos itens por página o relatório oferece; o primeiro é o padrão do servidor. */
export const REPORT_PAGE_SIZES = [10, 25, 50, 100];

/**
 * O rodapé de uma lista paginada de um relatório: "1–10 de 37", o tamanho da página ("10 por página") e as setas, como o `Pagination` das
 * outras tabelas. Some só quando cabe na menor página e ela é a escolhida (senão não haveria como voltar de uma página grande).
 */
export function ReportPager({
  page,
  pageCount,
  pageSize,
  count,
  onPage,
  onPageSize,
}: {
  page: number;
  pageCount: number;
  pageSize: number;
  count: number;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
}) {
  if (count <= REPORT_PAGE_SIZES[0] && pageSize === REPORT_PAGE_SIZES[0]) return null;

  return (
    <PageControls page={page} pageCount={pageCount} pageSize={pageSize} count={count} onPage={onPage}>
      <select
        aria-label="Itens por página"
        value={pageSize}
        onChange={(event) => onPageSize(Number(event.target.value))}
        className="h-7 cursor-pointer rounded-full bg-transparent px-2.5 text-caption text-ink-soft outline-none transition-colors hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-brand/50"
      >
        {REPORT_PAGE_SIZES.map((size) => (
          <option key={size} value={size}>
            {size} por página
          </option>
        ))}
      </select>
    </PageControls>
  );
}
