/** Uma lista própria do condomínio (blocos, sub-contas): o título e, à direita, as ações da lista. */
export function RegistrySection({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={title} className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-heading">{title}</h2>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}
