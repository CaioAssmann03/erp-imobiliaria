import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ListState({
  isLoading,
  isEmpty,
  emptyTitle,
  emptyText,
  children,
}: {
  isLoading: boolean;
  isEmpty: boolean;
  emptyTitle: string;
  emptyText?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="gap-0 p-3">
      {isLoading ? (
        <div className="space-y-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-6 px-3 py-3">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      ) : isEmpty ? (
        <div className="px-5 py-14 text-center">
          <p className="text-heading">{emptyTitle}</p>
          {emptyText && <p className="mt-1 text-body text-ink-soft">{emptyText}</p>}
        </div>
      ) : (
        children
      )}
    </Card>
  );
}
