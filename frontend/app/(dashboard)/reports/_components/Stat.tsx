/** Um número do alto de um relatório (rótulo pequeno e valor grande). */
export function Stat({ label, value, tone }: { label: string; value: string; tone?: "danger" }) {
  return (
    <div className="rounded-card bg-card p-5 shadow-card">
      <p className="text-caption font-medium text-ink-soft">{label}</p>
      <p className={`text-title tabular-nums ${tone === "danger" ? "text-danger" : ""}`}>{value}</p>
    </div>
  );
}
