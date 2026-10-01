import { cn } from "@/lib/utils";

/** Moldura do app (canvas cinza + shell arredondado). Usada pelo app e pelo login. */
export function ShellFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="min-h-screen p-2 md:p-4">
      <div
        className={cn(
          "mx-auto min-h-[calc(100vh-2rem)] max-w-[90rem] rounded-shell bg-shell p-3 md:p-5",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
