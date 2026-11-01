import Link from "next/link";
import { Plus } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const plusClass = "flex size-8 items-center justify-center rounded-control text-ink-soft outline-none transition-colors";

/**
 * O **+** do título de uma lista: um link para a tela de cadastro (`href`) ou um botão que abre algo (`onClick`). Com `disabledHint` ele fica apagado e
 * o texto diz o que falta (o escopo que ainda não foi escolhido).
 */
export function RegistryCreate({ label, href, onClick, disabledHint }: { label: string; href?: string; onClick?: () => void; disabledHint?: string }) {
  if (disabledHint)
    return (
      <span aria-disabled="true" title={disabledHint} className={cn(plusClass, "cursor-not-allowed opacity-40")}>
        <Plus className="size-5" />
      </span>
    );

  const className = cn(plusClass, "hover:bg-surface hover:text-ink focus-visible:ring-2 focus-visible:ring-ring");

  return href ? (
    <Link href={href} aria-label={label} title={label} className={className}>
      <Plus className="size-5" />
    </Link>
  ) : (
    <button type="button" aria-label={label} title={label} onClick={onClick} className={className}>
      <Plus className="size-5" />
    </button>
  );
}

/**
 * Uma linha da lista lateral: um link plano; a aberta (`isOpen`) é branca com a barra da marca e, havendo uma aberta (`dimmed`), as outras ficam
 * apagadas (voltam ao passar o mouse ou focar). O conteúdo (código, nome, segunda linha) é de cada módulo.
 */
export function RegistryListItem({
  href,
  isOpen = false,
  dimmed = false,
  onCard = false,
  children,
}: {
  href: string;
  isOpen?: boolean;
  dimmed?: boolean;
  /** A linha dentro de um cartão branco (as telas internas de um registro): o fundo ao passar o mouse é o do cartão. */
  onCard?: boolean;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={isOpen ? "page" : undefined}
        className={cn(
          "block rounded-panel px-3 py-2 transition-[background-color,opacity]",
          onCard ? "hover:bg-surface-muted" : "hover:bg-surface",
          isOpen && "bg-surface shadow-card shadow-[inset_3px_0_0_var(--color-brand)]",
          dimmed && !isOpen && "opacity-60 hover:opacity-100 focus-visible:opacity-100"
        )}
      >
        {children}
      </Link>
    </li>
  );
}

/**
 * A coluna da esquerda de um cadastro, a mesma em todo módulo: o título (com `actions`, em geral o **+**), a `toolbar` (escopo e busca), as linhas
 * (`children`, só `RegistryListItem`) com os esqueletos, a mensagem de vazio e, em `footer`, o "Mostrar mais". `blocked` é a mensagem de quando o escopo
 * que a lista exige ainda não foi escolhido (ela vale antes do carregamento e do vazio).
 */
export function RegistryList({
  label,
  title,
  actions,
  toolbar,
  navLabel,
  isLoading,
  isPlaceholderData = false,
  isEmpty,
  emptyMessage,
  blocked,
  footer,
  className,
  children,
}: {
  label: string;
  title: React.ReactNode;
  actions?: React.ReactNode;
  toolbar?: React.ReactNode;
  navLabel: string;
  isLoading: boolean;
  isPlaceholderData?: boolean;
  isEmpty: boolean;
  emptyMessage: string;
  blocked?: string | null;
  footer?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <aside
      aria-label={label}
      className={cn("w-full shrink-0 flex-col gap-3 lg:sticky lg:top-[4.25rem] lg:h-[calc(100vh-5.25rem)] lg:w-80 2xl:w-96", className)}
    >
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="text-heading">{title}</h2>
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </div>

      {toolbar}

      <nav aria-label={navLabel} className={cn("min-h-0 flex-1 overflow-y-auto pr-1 transition-opacity", isPlaceholderData && "opacity-60")}>
        {blocked ? (
          <p className="px-2 py-6 text-center text-body text-ink-soft">{blocked}</p>
        ) : isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} className="h-12 rounded-panel" />
            ))}
          </div>
        ) : isEmpty ? (
          <p className="px-2 py-6 text-center text-body text-ink-soft">{emptyMessage}</p>
        ) : (
          <ul className="space-y-0.5">{children}</ul>
        )}
      </nav>

      {footer}
    </aside>
  );
}
