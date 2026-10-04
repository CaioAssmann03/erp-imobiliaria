import { Caption } from "./Caption";
import { LinkButton } from "@/components/LinkButton";
import { SeeAllLink } from "../SeeAllLink";

import type { WidgetBuilder } from "./types";

function TypeList({ items }: { items: { title: string; total: number }[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item.title} className="flex justify-between">
          <span className="text-ink-soft">{item.title}</span>
          <span className="tabular-nums">{item.total}</span>
        </li>
      ))}
    </ul>
  );
}

export const buildCondominiumsWidget: WidgetBuilder = (dash) => ({
  title: "Condomínios administrados",
  className: "lg:col-span-5",
  showHeader: false,
  render: (large) => (
    <>
      <div className="rounded-panel bg-surface-muted p-4">
        <Caption>Condomínios administrados</Caption>
        <div className="mt-1 text-display tabular-nums">{dash?.condominiums.total ?? "–"}</div>
        <div className="mt-4 flex rounded-full bg-surface p-0.5">
          <LinkButton className="flex-1" href="/condominiums/new">
            Novo condomínio
          </LinkButton>
          <LinkButton className="flex-1" variant="ghost" href="/persons/new">
            Nova pessoa
          </LinkButton>
        </div>
      </div>
      <div className="mt-4 flex items-start justify-between gap-6 px-1">
        <div>
          <Caption>Em operação</Caption>
          <div className="text-heading tabular-nums">
            {dash?.condominiums.active ?? "–"}
            <span className="font-normal text-ink-faint"> de {dash?.condominiums.total ?? "–"}</span>
          </div>
        </div>
        {large ? (
          <div className="min-w-40">
            <Caption>Por tipo</Caption>
            <TypeList items={dash?.condominiums.by_type ?? []} />
          </div>
        ) : (
          <SeeAllLink href="/condominiums" />
        )}
      </div>
    </>
  ),
});
