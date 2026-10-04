/** Barra acima de uma listagem (fixa no topo ao rolar): busca e filtros à esquerda, contagem à direita. */
export function Toolbar({
  children,
  right,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="sticky top-14 z-20 -mx-2 mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-2xl bg-shell/95 px-2 py-2 backdrop-blur-md lg:top-2 lg:rounded-full">
      <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:flex-1">{children}</div>
      {right && <span className="hidden shrink-0 text-body text-ink-soft sm:inline">{right}</span>}
    </div>
  );
}
