import type { UpcomingAdjustment } from "@/lib/api/generated/models";

import { Late } from "./Late";
import { RecentList } from "./RecentList";
import { formatDate, relativeDays } from "./relative-days";

/** Server Component: próximos reajustes de contrato, os atrasados em vermelho. */
export function UpcomingAdjustments({ adjustments }: { adjustments: UpcomingAdjustment[] }) {
  return (
    <RecentList
      title="Próximos reajustes"
      allHref="/condominiums"
      metaLabel="Data"
      extraLabel="Prazo"
      emptyText="Nenhum condomínio com reajuste configurado."
      items={adjustments.map((adjustment) => ({
        id: adjustment.id,
        name: adjustment.name,
        meta: `${formatDate(adjustment.date)}${adjustment.index ? ` · ${adjustment.index}` : ""}`,
        extra: adjustment.overdue ? (
          <Late>{relativeDays(adjustment.date)}</Late>
        ) : (
          relativeDays(adjustment.date)
        ),
        href: `/condominiums/${adjustment.id}`,
      }))}
    />
  );
}
