/** Um par rótulo/valor das páginas de documento (dentro de um `<dl>`), no mesmo traço do lançamento da Inclusão de valores. */
export function DocumentItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-caption text-ink-soft">{label}</dt>
      <dd className="mt-0.5 text-body">{children}</dd>
    </div>
  );
}
