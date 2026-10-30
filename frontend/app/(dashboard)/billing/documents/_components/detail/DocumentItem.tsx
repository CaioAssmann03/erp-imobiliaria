/** Um par rótulo/valor das páginas de documento (dentro de um `<dl>`). */
export function DocumentItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-caption uppercase tracking-wide text-ink-soft">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}
