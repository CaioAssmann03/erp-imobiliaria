"use client";

import Link from "next/link";

import { Skeleton } from "@/components/ui/skeleton";
import { useBillingDocumentsDelinquency } from "@/lib/api/generated";
import { ROW_LINK } from "@/app/(dashboard)/_components/home/shared/row-link";
import { Late } from "@/app/(dashboard)/_components/home/shared/Late";
import { brlWhole, integer } from "@/app/(dashboard)/_components/home/widgets/format";

const SHOWN = 3;

/** Client Component: o que a imobiliária tem a receber e já venceu: o total sozinho em tipo grande, os condomínios que mais devem (o relatório de inadimplência) e, no pé, a quantidade de boletos. */
export function DelinquencyBody() {
  const { data, isLoading } = useBillingDocumentsDelinquency({ condominiums_order: "amount" });
  const late = (data?.count ?? 0) > 0;
  const top = (data?.by_condominium ?? []).slice(0, SHOWN);

  if (isLoading) return <Skeleton className="h-24 rounded-panel" />;

  return (
    <>
      <div className="text-title tabular-nums">{data ? brlWhole(data.total_amount) : "–"}</div>
      {top.length > 0 && (
        <ul className="mt-3 divide-y divide-border">
          {top.map((item) => (
            <li key={item.condominium_id}>
              <Link
                href={`/reports/delinquency?condominium=${item.condominium_id}`}
                title={`Abrir a inadimplência de ${item.condominium_name}`}
                className={`${ROW_LINK} flex items-baseline justify-between gap-3 py-2`}
              >
                <span className="min-w-0 truncate text-ink-soft">{item.condominium_name}</span>
                <span className="shrink-0 tabular-nums">{brlWhole(item.total_amount)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {data && (
        <p className="mt-auto pt-3 text-caption text-ink-faint">
          {late ? (
            <Late>
              {integer(data.count)} boleto{data.count === 1 ? "" : "s"} vencido{data.count === 1 ? "" : "s"} e não pago{data.count === 1 ? "" : "s"}
            </Late>
          ) : (
            "Nenhum boleto vencido"
          )}
        </p>
      )}
    </>
  );
}
