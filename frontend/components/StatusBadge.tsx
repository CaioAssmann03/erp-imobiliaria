import { Badge } from "@/components/ui/badge";

export function StatusBadge({ ativo }: { ativo?: boolean }) {
  return (
    <Badge variant={ativo ? "success" : "danger"}>
      <span className="size-1.5 rounded-full bg-current" />
      {ativo ? "Ativo" : "Inativo"}
    </Badge>
  );
}
