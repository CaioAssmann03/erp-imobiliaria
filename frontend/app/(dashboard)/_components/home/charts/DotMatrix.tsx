import { cn } from "@/lib/utils";

/**
 * Matriz de pontos em CSS: `filled` de `total` pontos acesos (laranja).
 * Com `secondary`, parte dos pontos acesos vira escura (ex.: física × jurídica).
 */
export function DotMatrix({
  filled,
  total,
  columns = 24,
  rows = 6,
}: {
  filled: number;
  total: number;
  columns?: number;
  rows?: number;
}) {
  const cells = columns * rows;
  const lit = total > 0 ? Math.round((filled / total) * cells) : 0;

  return (
    <div
      className="grid gap-1"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      role="img"
      aria-label={`${filled} de ${total}`}
    >
      {Array.from({ length: cells }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "aspect-square rounded-full",
            i < lit ? "bg-brand" : "bg-surface-sunken"
          )}
        />
      ))}
    </div>
  );
}
