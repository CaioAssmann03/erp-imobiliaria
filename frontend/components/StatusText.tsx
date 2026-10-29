import { cn } from "@/lib/utils";

/** A situação de um cadastro em texto simples, sem selo: só a palavra, verde quando ativo e preto quando inativo (como ao lado do nome do condomínio). */
export function StatusText({ active, className }: { active: boolean; className?: string }) {
  return <span className={cn("text-body font-medium", active ? "text-success" : "text-ink", className)}>{active ? "Ativo" : "Inativo"}</span>;
}
