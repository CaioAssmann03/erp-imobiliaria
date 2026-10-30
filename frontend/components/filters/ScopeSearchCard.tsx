import { cn } from "@/lib/utils";

/**
 * O cartão do alto das listas laterais: numa linha, os seletores de escopo (`ScopeSelect variant="segment"`, condomínio e, quando há, bloco ou
 * unidade, separados por `ScopeDivider`) e, **colada embaixo**, a busca (`children`), tudo num cartão branco só, sem espaço nem linha entre elas.
 * Sem `children` (a lista ainda não tem escopo escolhido) o cartão é só a linha dos seletores.
 */
export function ScopeSearchCard({ scopes, children }: { scopes: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="rounded-control bg-surface shadow-card">
      <div className="flex h-12 items-center p-1">{scopes}</div>
      {children}
    </div>
  );
}

/** A busca dentro de `ScopeSearchCard`: ícone, campo e, se houver, o filtro compacto (`children` depois do campo). */
export function ScopeSearchRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex h-11 items-center gap-2.5 rounded-b-control pr-2 pl-4 text-ink-soft focus-within:ring-2 focus-within:ring-brand/50 focus-within:ring-inset",
        className
      )}
    >
      {children}
    </div>
  );
}

/** O traço vertical entre dois seletores da linha de escopo. */
export function ScopeDivider() {
  return <span aria-hidden className="mx-1 h-6 w-px shrink-0 bg-ink/10" />;
}
