import { LinkButton } from "@/components/LinkButton";
import type { Dashboard, Summary } from "@/lib/api/generated/models";

import { FocusSection, FocusStat, ShareBar, percent, typeLabel } from "./parts";

function SummaryBlock({ title, summary, href }: { title: string; summary: Summary | undefined; href: string }) {
  const total = summary?.total ?? 0;
  const active = summary?.active ?? 0;
  const biggest = Math.max(0, ...(summary?.by_type ?? []).map((item) => item.total));

  return (
    <FocusSection title={title} action={{ href, label: "Ver lista" }}>
      <FocusStat
        label="Total"
        value={summary ? total : "–"}
        hint={
          summary
            ? `${active} ${active === 1 ? "ativo" : "ativos"} · ${total - active} ${total - active === 1 ? "inativo" : "inativos"} (${percent(active, total)}% ativos)`
            : undefined
        }
      />
      <div className="space-y-3">
        {(summary?.by_type ?? []).map((item) => (
          <ShareBar
            key={item.title}
            label={typeLabel(item.title)}
            value={item.total}
            max={biggest}
            text={`${item.total} · ${percent(item.total, total)}%`}
          />
        ))}
        {summary && summary.by_type.length === 0 && <p className="text-ink-soft">Nenhum cadastro.</p>}
      </div>
    </FocusSection>
  );
}

/** Visão completa dos cadastros: ativos e inativos e a divisão por tipo de cada grupo, com atalho para a lista. */
export function CondominiumsFocus({ dash }: { dash: Dashboard | undefined }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-8 md:grid-cols-3">
        <SummaryBlock title="Condomínios" summary={dash?.condominiums} href="/condominiums" />
        <SummaryBlock title="Unidades" summary={dash?.units} href="/condominiums/units" />
        <SummaryBlock title="Pessoas" summary={dash?.persons} href="/persons" />
      </div>
      <div className="flex flex-wrap gap-2">
        <LinkButton href="/condominiums/new">Novo condomínio</LinkButton>
        <LinkButton variant="secondary" href="/condominiums/units/new">
          Nova unidade
        </LinkButton>
        <LinkButton variant="secondary" href="/persons/new">
          Nova pessoa
        </LinkButton>
      </div>
    </div>
  );
}
