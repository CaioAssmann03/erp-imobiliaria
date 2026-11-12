import { cn } from "@/lib/utils";

/**
 * Um grupo de linhas de configuração: um painel suave (`surface-muted`) com as linhas dentro, separadas por um fio fino, e um título
 * discreto opcional acima. O painel dá estrutura sem pesar; o respiro vem do espaço das linhas.
 */
export function SettingsGroup({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section>
      {title && <h3 className="mb-2.5 px-1 text-caption font-medium text-ink-soft">{title}</h3>}
      <div className="divide-y divide-border/60 rounded-panel bg-surface-muted/60 px-5 sm:px-6">{children}</div>
    </section>
  );
}

/**
 * Uma configuração: o nome e a explicação à esquerda, o controle à direita (embaixo, no celular). Com `stacked`, o controle vai
 * sempre embaixo do texto, na largura toda: para opções com rótulos longos ou várias opções, que ficariam espremidas ao lado.
 */
export function SettingsRow({
  title,
  description,
  compact = false,
  stacked = false,
  children,
}: {
  title: string;
  description?: string;
  /** Linha baixa, para listas curtas (os atalhos). */
  compact?: boolean;
  /** O controle fica embaixo do nome, na largura toda (controles largos, como as cores e as faixas de opções). */
  stacked?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-4", !stacked && "sm:flex-row sm:items-center sm:justify-between sm:gap-10", compact ? "py-3.5" : "py-5")}>
      <div className="min-w-0 sm:max-w-[26rem]">
        <h4 className="text-body font-medium">{title}</h4>
        {description && <p className="mt-1 text-caption leading-relaxed text-ink-soft">{description}</p>}
      </div>
      <div className={cn(stacked ? "min-w-0" : "shrink-0")}>{children}</div>
    </div>
  );
}
