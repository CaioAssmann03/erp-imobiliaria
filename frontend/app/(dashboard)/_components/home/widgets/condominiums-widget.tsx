import { Caption } from "./Caption";
import { LinkButton } from "@/components/LinkButton";

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

function Stat({ label, total, active }: { label: string; total: number | undefined; active: number | undefined }) {
  return (
    <div>
      <Caption>{label}</Caption>
      <div className="text-heading tabular-nums">
        {total ?? "–"}
        <span className="text-caption font-normal text-ink-faint"> · {active ?? "–"} ativos</span>
      </div>
    </div>
  );
}

export const buildCondominiumsWidget: WidgetBuilder = (dash) => ({
  title: "Resumo dos cadastros",
  className: "lg:col-span-12",
  showHeader: false,
  render: (large) => (
    <>
      <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-4">
        <div className="flex flex-wrap gap-x-10 gap-y-3">
          <Stat label="Condomínios" total={dash?.condominiums.total} active={dash?.condominiums.active} />
          <Stat label="Unidades" total={dash?.units.total} active={dash?.units.active} />
          <Stat label="Pessoas" total={dash?.persons.total} active={dash?.persons.active} />
        </div>
        <div className="flex gap-2">
          <LinkButton variant="secondary" href="/persons/new">
            Nova pessoa
          </LinkButton>
          <LinkButton href="/condominiums/new">Novo condomínio</LinkButton>
        </div>
      </div>
      {large && (
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <div>
            <Caption>Condomínios por tipo</Caption>
            <TypeList items={dash?.condominiums.by_type ?? []} />
          </div>
          <div>
            <Caption>Unidades por tipo</Caption>
            <TypeList items={dash?.units.by_type ?? []} />
          </div>
          <div>
            <Caption>Pessoas por tipo</Caption>
            <TypeList items={dash?.persons.by_type ?? []} />
          </div>
        </div>
      )}
    </>
  ),
});
