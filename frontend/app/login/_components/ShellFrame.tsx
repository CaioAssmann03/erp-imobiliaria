import { cn } from "@/lib/utils";

export function ShellFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="min-h-screen bg-shell lg:bg-transparent lg:p-4">
      <div
        className={cn(
          "min-h-screen bg-shell p-4 lg:min-h-[calc(100vh-2rem)] lg:rounded-shell lg:p-5",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
