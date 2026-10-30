/**
 * Classes compartilhadas pelos formulários. Usam apenas tokens do design
 * system (ver app/globals.css e docs/norms/design-system.md) — não use cores ou tamanhos soltos.
 */

export const inputClass =
  "h-9 w-full min-w-0 rounded-control bg-surface-muted px-4 text-body text-ink outline-none transition-colors placeholder:text-ink-faint focus:bg-surface focus:ring-2 focus:ring-brand/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:bg-danger-soft/50 aria-invalid:ring-2 aria-invalid:ring-danger/40";

export const selectClass = inputClass;

export const labelClass = "mb-1 block text-caption font-medium text-ink-soft";

export const fieldWrapClass = "flex flex-col";

export const errorTextClass = "mt-1 text-caption text-danger";

export const sectionClass = "space-y-4 rounded-card bg-card p-5 shadow-card";

export const sectionTitleClass = "text-heading";

export const buttonPrimaryClass =
  "inline-flex h-8 items-center justify-center gap-2 rounded-full bg-ink px-4 text-body font-medium text-ink-foreground transition-colors hover:bg-ink/85 disabled:pointer-events-none disabled:opacity-50";

export const buttonSecondaryClass =
  "inline-flex h-8 items-center justify-center gap-2 rounded-full bg-surface-muted px-4 text-body font-medium text-ink transition-colors hover:bg-surface-sunken disabled:pointer-events-none disabled:opacity-50";

export const buttonDangerClass =
  "inline-flex h-8 items-center justify-center rounded-full bg-danger-soft px-3.5 text-caption font-medium text-danger transition-colors hover:bg-danger/15";

export const checkboxLabelClass = "flex items-center gap-2 text-body text-ink";

export const formActionsClass =
  "sticky bottom-4 z-10 flex items-center gap-3 rounded-card bg-card p-3 shadow-float";

/**
 * O fundo de um modal (busca, configurações, visão ampliada do painel, confirmações): escurece só um pouco a página, sem desfocar. O menu lateral
 * fica acima dele (`z-[60]` na rail) e por isso não escurece; quem usa põe o `z-` (40 ou 50).
 */
export const modalBackdropClass =
  "fixed inset-0 bg-black/30 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0";
