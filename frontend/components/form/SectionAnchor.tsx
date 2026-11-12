import { cn } from "@/lib/utils";

/**
 * O lugar de uma seção de uma página de registro: o `id` é o âncora para a qual o menu da direita (`SectionIndex`) rola, e `scroll-mt-20` deixa um
 * respiro para a seção não parar embaixo do topo. `className` junta o que a seção precisa (`space-y-4`, `border-t`…).
 */
export function SectionAnchor({ id, className, children }: { id: string; className?: string; children: React.ReactNode }) {
  return (
    <div id={id} className={cn("scroll-mt-20", className)}>
      {children}
    </div>
  );
}
