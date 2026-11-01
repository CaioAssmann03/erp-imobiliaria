import type { UpcomingAdjustment } from "@/lib/api/generated/models";
import { formatDate, relativeDays } from "@/app/(dashboard)/_components/home/shared/relative-days";

import { RecentList } from "./RecentList";

export function UpcomingAdjustments({ adjustments }: { adjustments: UpcomingAdjustment[] }) {
  return (
    <RecentList
      title="Próximos reajustes"
      allHref="/condominiums"
      emptyText="Nenhum condomínio com reajuste configurado."
      items={adjustments.map((adjustment) => ({
        id: adjustment.id,
        name: adjustment.name,
        meta: formatDate(adjustment.date),
        extra: relativeDays(adjustment.date),
        href: `/condominiums/${adjustment.id}`,
      }))}
    />
  );
}
