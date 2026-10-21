import type { Dashboard } from "@/lib/api/generated/models";

import { brl } from "../format";
import { FocusSection, FocusStat, ShareBar, percent } from "./parts";

/** Visão completa da receita fixa: o total, a média, a quantidade de cada tipo de taxa e o peso de cada condomínio. */
export function FixedRevenueFocus({ dash }: { dash: Dashboard | undefined }) {
  const revenue = dash?.fixed_revenue;
  const total = Number(revenue?.monthly_total ?? 0);
  const largest = revenue?.largest ?? [];
  const biggest = Math.max(0, ...largest.map((item) => Number(item.amount)));
  const average = revenue && revenue.fixed_condominiums > 0 ? total / revenue.fixed_condominiums : 0;
  const topShare = largest.reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FocusStat label="Receita fixa por mês" value={revenue ? brl(total) : "–"} />
        <FocusStat label="Média por condomínio" value={revenue ? brl(average) : "–"} hint="Só os de taxa fixa" />
        <FocusStat label="Com taxa fixa" value={revenue?.fixed_condominiums ?? "–"} hint="Entram neste total" />
        <FocusStat
          label="Com taxa variável"
          value={revenue?.variable_condominiums ?? "–"}
          hint="Dependem do financeiro: ficam fora"
        />
      </div>
      <FocusSection title="Maiores taxas" action={{ href: "/condominiums", label: "Ver condomínios" }}>
        {largest.length === 0 ? (
          <p className="text-ink-soft">Nenhum condomínio com taxa fixa.</p>
        ) : (
          <div className="space-y-3">
            {largest.map((item) => (
              <ShareBar
                key={item.id}
                label={item.name}
                value={Number(item.amount)}
                max={biggest}
                href={`/condominiums/${item.id}`}
                text={`${brl(item.amount)} · ${percent(Number(item.amount), total)}% do total`}
              />
            ))}
            <p className="text-caption text-ink-soft">
              Estes {largest.length} somam {brl(topShare)}, {percent(topShare, total)}% da receita fixa.
            </p>
          </div>
        )}
      </FocusSection>
    </div>
  );
}
