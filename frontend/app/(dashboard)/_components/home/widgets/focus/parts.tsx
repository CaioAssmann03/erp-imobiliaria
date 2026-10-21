import Link from "next/link";

import { cn } from "@/lib/utils";

/** Um número em destaque com o seu rótulo, no painel ampliado de cada card. */
export function FocusStat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: "default" | "danger" | "success";
}) {
  return (
    <div className="rounded-panel bg-surface-muted p-4">
      <p className="text-caption text-ink-soft">{label}</p>
      {/* A cor vai num span: `text-title` e `text-danger` no mesmo elemento se anulam no `cn`. */}
      <div className="mt-1 text-title tabular-nums">
        <span className={cn(tone === "danger" && "text-danger", tone === "success" && "text-success")}>{value}</span>
      </div>
      {hint && <p className="mt-0.5 text-caption text-ink-soft">{hint}</p>}
    </div>
  );
}

/** Uma barra proporcional com rótulo e valor: `value` em relação a `max` (as larguras são só proporção). */
export function ShareBar({
  label,
  value,
  max,
  text,
  href,
}: {
  label: string;
  value: number;
  max: number;
  text: React.ReactNode;
  href?: string;
}) {
  const width = max > 0 ? Math.max((value / max) * 100, value > 0 ? 2 : 0) : 0;
  const name = href ? (
    <Link href={href} className="truncate hover:underline">
      {label}
    </Link>
  ) : (
    <span className="truncate">{label}</span>
  );

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-3 text-body">
        {name}
        <span className="shrink-0 tabular-nums text-ink-soft">{text}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-sunken">
        <div className="h-full rounded-full bg-brand" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

/** Um bloco do painel ampliado: título pequeno, um atalho opcional à direita e o conteúdo. */
export function FocusSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-heading">{title}</h3>
        {action && (
          <Link href={action.href} className="text-body text-ink-soft hover:text-ink hover:underline">
            {action.label} →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

const TYPE_LABELS: Record<string, string> = {
  Residential: "Residencial",
  Commercial: "Comercial",
  Apartment: "Apartamento",
  Office: "Sala comercial",
  Store: "Loja",
  House: "Casa",
  Suite: "Suíte",
  "Parking Space": "Vaga de garagem",
  Other: "Outro",
  Individual: "Pessoa física",
  Legal: "Pessoa jurídica",
};

/** O tipo como a API o devolve (em inglês) → o texto em português; um tipo novo aparece como veio. */
export const typeLabel = (title: string) => TYPE_LABELS[title] ?? title;

export const percent = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);
