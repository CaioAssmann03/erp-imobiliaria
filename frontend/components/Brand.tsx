/** A marca: o "E" e, fora do modo `compact` (a rail), o nome. */
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-control bg-brand-gradient text-body font-semibold text-brand-foreground">
        E
      </span>
      {!compact && <span className="text-body font-medium">ERP Imobiliária</span>}
    </span>
  );
}
