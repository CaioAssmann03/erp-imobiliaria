import { Skeleton } from "@/components/ui/skeleton";

/** Fallback do `Suspense` que envolve uma listagem: a tabela lê a URL (`useSearchParams`) no cliente. */
export function ListFallback() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-72 w-full" />
    </div>
  );
}
