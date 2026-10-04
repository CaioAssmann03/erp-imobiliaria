/** Seção com título à esquerda e o valor atual à direita. */
export function SettingsSection({
  title,
  value,
  children,
}: {
  title: string;
  value?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-body font-medium">{title}</h3>
        {value && <span className="text-caption text-ink-soft">{value}</span>}
      </div>
      {children}
    </section>
  );
}
