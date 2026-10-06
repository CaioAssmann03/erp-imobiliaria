import { Label } from "@/components/ui/label";

/** Rótulo do campo com a mensagem de erro à direita, na mesma linha (não ocupa espaço extra). */
export function FieldLabel({
  htmlFor,
  error,
  children,
}: {
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-4 items-center justify-between gap-3 px-1">
      <Label htmlFor={htmlFor}>{children}</Label>
      <span role="alert" className="text-caption leading-4 text-danger">
        {error}
      </span>
    </div>
  );
}
