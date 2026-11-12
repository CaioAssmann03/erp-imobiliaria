import Link from "next/link";

import type { Dashboard } from "@/lib/api/generated/models";
import { ROW_LINK } from "@/app/(dashboard)/_components/home/shared/row-link";
import { brlWhole, integer } from "@/app/(dashboard)/_components/home/widgets/format";

const SHORT_LIST = 5;

/**
 * O corpo do card de receita fixa: o total mensal sozinho em tipo grande (o "por mês" está no título), os maiores contratos (nome e valor) e, no pé, de quantos condomínios de taxa fixa o total é a soma e quantos de taxa variável ficam de fora. A visão ampliada (`FixedRevenueFocus`) mostra a média e a lista completa.
 */
export function FixedRevenueBody({ revenue }: { revenue: Dashboard["fixed_revenue"] | undefined }) {
  const total = Number(revenue?.monthly_total ?? 0);
  const largest = (revenue?.largest ?? []).slice(0, SHORT_LIST);
  const fixed = revenue?.fixed_condominiums ?? 0;
  const variable = revenue?.variable_condominiums ?? 0;

  return (
    <>
      <div className="text-title tabular-nums">{revenue ? brlWhole(total) : "–"}</div>

      {revenue && largest.length === 0 ? (
        <p className="mt-4 text-ink-soft">Nenhum condomínio com taxa fixa.</p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {largest.map((item) => (
            <li key={item.id}>
              <Link href={`/condominiums/${item.id}`} className={`${ROW_LINK} flex items-baseline justify-between gap-3 py-2`}>
                <span className="min-w-0 truncate text-ink-soft">{item.name}</span>
                <span className="shrink-0 tabular-nums">{brlWhole(item.amount)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {revenue && (
        <p className="mt-auto pt-3 text-caption text-ink-faint">
          Soma de {integer(fixed)} condomínio{fixed === 1 ? "" : "s"} de taxa fixa.
          {variable > 0 && ` ${integer(variable)} de taxa variável ${variable === 1 ? "fica" : "ficam"} fora.`}
        </p>
      )}
    </>
  );
}
