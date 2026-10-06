import { Skeleton } from "@/components/ui/skeleton";

export function FormSkeleton({ sections = 2 }: { sections?: number }) {
  return (
    <div className="max-w-5xl space-y-4" aria-busy="true" aria-label="Carregando formulário">
      {Array.from({ length: sections }).map((_, section) => (
        <div key={section} className="rounded-card bg-card p-5 shadow-card">
          <Skeleton className="mb-4 h-5 w-40" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, field) => (
              <div key={field} className="space-y-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
