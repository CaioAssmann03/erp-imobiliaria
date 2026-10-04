import type { Lease } from "@/lib/api/generated/models";

import { Late } from "./Late";
import { RecentList } from "./RecentList";
import { relativeDays } from "./relative-days";

/** Server Component: locações que terminam em breve (ou já terminaram e esperam renovação). */
export function EndingLeases({ leases }: { leases: Lease[] }) {
  return (
    <RecentList
      title="Locações a vencer"
      allHref="/condominiums"
      metaLabel="Locatário"
      extraLabel="Fim"
      emptyText="Nenhuma locação termina nos próximos 60 dias."
      items={leases.map((lease) => ({
        id: lease.id,
        name: `Unidade ${lease.unit} · ${lease.condominium_name}`,
        meta: lease.tenant,
        // Já encerrada: só "há 12 dias" em vermelho (a cor já diz que passou do prazo).
        extra: lease.ended ? <Late>{relativeDays(lease.end_date)}</Late> : relativeDays(lease.end_date),
        href: `/condominiums/${lease.condominium}/units/${lease.id}`,
      }))}
    />
  );
}
