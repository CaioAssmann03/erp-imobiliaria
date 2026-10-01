import { cn } from "@/lib/utils";

/** Moldura do login: tela inteira no celular; no desktop, canvas cinza + shell arredondado. */
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
          "mx-auto min-h-screen max-w-[90rem] bg-shell p-4 lg:min-h-[calc(100vh-2rem)] lg:rounded-shell lg:p-5",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
