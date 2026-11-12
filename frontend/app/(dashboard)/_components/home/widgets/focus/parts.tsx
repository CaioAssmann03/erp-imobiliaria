import Link from "next/link";

import { PageControls } from "@/components/data-list/PageControls";
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

/**
 * A barra fina de uma visão ampliada: cada segmento ocupa `value` em relação a `max` (as larguras são só proporção) e leva a sua cor (`className`, um `bg-*` de token).
 * Um segmento com valor aparece mesmo quando é pequeno demais para ser visto. `label` é o texto lido pelos leitores de tela.
 */
export function SegmentedBar({ segments, max, label }: { segments: { value: number; className: string }[]; max: number; label: string }) {
  return (
    <div role="img" aria-label={label} className="flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-surface-sunken">
      {segments.map((segment, index) => (
        <div key={index} className={cn("h-full", segment.className)} style={{ width: `${max > 0 && segment.value > 0 ? Math.max((segment.value / max) * 100, 1.5) : 0}%` }} />
      ))}
    </div>
  );
}

/** O ponto de cor que liga uma linha da legenda ao segmento da `SegmentedBar`. */
export function LegendDot({ className }: { className: string }) {
  return <span aria-hidden className={cn("mr-2 inline-block size-2 rounded-full", className)} />;
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

/** Uma lista curta das visões ampliadas, sem divisórias: título pequeno, um atalho opcional à direita e as linhas (`FocusRow`) logo abaixo. */
export function FocusList({
  title,
  action,
  children,
}: {
  title: string;
  action?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between gap-3 px-3">
        <h3 className="text-heading">{title}</h3>
        {action && (
          <Link href={action.href} className="text-body text-ink-soft hover:text-ink hover:underline">
            {action.label} →
          </Link>
        )}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/**
 * Uma linha de `FocusList`: o nome à esquerda (com uma linha de apoio opcional, `sub`) e um detalhe à direita; a linha toda é o link e ganha o fundo ao passar o mouse.
 */
export function FocusRow({ href, title, sub, detail, children }: { href: string; title?: string; sub?: React.ReactNode; detail?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link href={href} title={title} className="flex items-baseline justify-between gap-3 rounded-button px-3 py-2 hover:bg-surface-muted">
      <span className="min-w-0">
        <span className="block truncate">{children}</span>
        {sub && <span className="block truncate text-caption text-ink-soft">{sub}</span>}
      </span>
      {detail && <span className="shrink-0 text-caption tabular-nums">{detail}</span>}
    </Link>
  );
}

/** Uma linha do quadro de números das visões ampliadas (dentro de um `<dl>`): o nome, um detalhe e o valor, alinhados em colunas. `muted` é para o que só acompanha. */
export function LedgerRow({ label, detail, value, muted = false }: { label: string; detail?: string; value: string; muted?: boolean }) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-baseline gap-x-6 py-2">
      <dt className="truncate text-ink-soft">{label}</dt>
      <dd className="text-right text-caption tabular-nums text-ink-faint">{detail}</dd>
      <dd className={cn("min-w-28 text-right tabular-nums", muted && "text-ink-soft")}>{value}</dd>
    </div>
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

/** "1 boleto", "3 boletos". */
export const boletos = (count: number) => `${count.toLocaleString("pt-BR")} boleto${count === 1 ? "" : "s"}`;

export const percent = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

/** Quantos itens uma lista das visões ampliadas mostra por página. */
export const FOCUS_PAGE_SIZE = 10;

/**
 * O rodapé de uma lista das visões ampliadas do painel: "1–10 de 37" e as setas, 10 por página (a página e o total são da API). Cabendo numa página só, mostra
 * apenas a contagem ("7 contas"), sem setas.
 */
export function FocusPager({ page, count, noun, onPage }: { page: number; count: number; noun: string; onPage: (page: number) => void }) {
  if (count === 0) return null;
  if (count <= FOCUS_PAGE_SIZE) return <p className="px-3 text-caption tabular-nums text-ink-soft">{count} {noun}</p>;
  return <PageControls page={page} pageCount={Math.ceil(count / FOCUS_PAGE_SIZE)} pageSize={FOCUS_PAGE_SIZE} count={count} onPage={onPage} />;
}
