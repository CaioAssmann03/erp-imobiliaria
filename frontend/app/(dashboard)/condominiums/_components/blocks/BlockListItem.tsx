import Link from "next/link";

import { withFrom } from "@/lib/navigation/back-target";
import { blockUnitsUrl, blockUrl } from "@/lib/condominiums/block-workspace";
import type { Block } from "@/lib/api/generated/models";
import { cn } from "@/lib/utils";

/**
 * Um bloco na lista no padrão da lista de condomínios. `isOpen` marca o aberto e `dimmed` apaga os outros quando há um aberto;
 * `onCard` é para a lista dentro de um cartão branco. `withUnitsLink` (só na tela de blocos do condomínio) põe o atalho "Ver unidades"
 * à direita, que abre a sub-tela de unidades do bloco.
 */
export function BlockListItem({
  block,
  isOpen = false,
  dimmed = false,
  onCard = false,
  withUnitsLink = false,
  from,
}: {
  block: Block;
  isOpen?: boolean;
  dimmed?: boolean;
  onCard?: boolean;
  withUnitsLink?: boolean;
  /** A tela de onde se chegou (o "voltar" do bloco leva a ela). */
  from?: string | null;
}) {
  return (
    <li
      className={cn(
        "flex items-center gap-1 rounded-panel transition-[background-color,opacity]",
        onCard ? "hover:bg-surface-muted" : "hover:bg-surface",
        isOpen && "bg-surface shadow-card shadow-[inset_3px_0_0_var(--color-brand)]",
        dimmed && !isOpen && "opacity-60 hover:opacity-100 focus-within:opacity-100"
      )}
    >
      <Link
        href={withFrom(blockUrl(block.id), from)}
        aria-current={isOpen ? "page" : undefined}
        className="block min-w-0 flex-1 truncate rounded-panel px-3 py-3 text-body font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {block.name}
      </Link>
      {withUnitsLink && (
        <Link
          href={withFrom(blockUnitsUrl(block.id), from)}
          className="mr-2 shrink-0 rounded-control px-2 py-1 text-caption text-ink-soft outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-ring"
        >
          Ver unidades
        </Link>
      )}
    </li>
  );
}
