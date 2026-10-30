import { cn } from "@/lib/utils";

/** Um grupo de linhas de configuração, com um título discreto opcional; as linhas se separam por um fio fino. */
export function SettingsGroup({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section>
      {title && <h3 className="mb-1 text-caption font-medium text-ink-soft">{title}</h3>}
      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}

/** Uma configuração: o nome e a explicação à esquerda, o controle à direita (embaixo, no celular). */
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
  /** O controle fica embaixo do nome (controles largos, como as cores). */
  stacked?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-3", !stacked && "sm:flex-row sm:items-center sm:justify-between sm:gap-8", compact ? "py-3 first:pt-1" : "py-5 first:pt-2")}>
      <div className="min-w-0">
        <h4 className="text-body font-medium">{title}</h4>
        {description && <p className="mt-0.5 text-caption text-ink-soft">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
