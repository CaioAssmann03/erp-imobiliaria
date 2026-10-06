export function FormSection({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-card bg-card p-6 shadow-card">
      {title && (
        <header className="mb-5">
          <h2 className="text-heading">{title}</h2>
          {description && <p className="mt-0.5 text-caption text-ink-soft">{description}</p>}
        </header>
      )}
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

const ROW_COLUMNS = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
} as const;

/**
 * Campos relacionados lado a lado (2 ou 3 no máximo; em telas estreitas empilham).
 * Use `columns` para colunas iguais ou `template` para proporções (ex.: "2fr 1fr"),
 * dando mais espaço ao campo que precisa (nome, logradouro) e menos ao curto (UF).
 */
export function FieldRow({
  columns = 2,
  template,
  children,
}: {
  columns?: 2 | 3;
  template?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`grid grid-cols-1 gap-x-4 gap-y-3 ${template ? "sm:[grid-template-columns:var(--row)]" : ROW_COLUMNS[columns]}`}
      style={template ? ({ "--row": template } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
