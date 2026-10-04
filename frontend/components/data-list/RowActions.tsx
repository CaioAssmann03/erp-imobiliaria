/** Ações secundárias da linha: aparecem ao passar o mouse ou focar (sempre visíveis no toque). */
export function RowActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 flex items-center justify-end gap-1 opacity-0 transition-opacity group-focus-within/row:opacity-100 group-hover/row:opacity-100 [@media(hover:none)]:opacity-100">
      {children}
    </div>
  );
}
