"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardRetrieve } from "@/lib/api/generated";
import { brlWhole } from "@/lib/format/format";

/** As três janelas não se sobrepõem (o "neste mês" do painel se sobrepõe a elas, por isso fica de fora). A cor segue o que cada uma pede de atenção. */
const WINDOWS = [
  { key: "overdue", label: "Vencidas", color: "var(--color-danger)" },
  { key: "due_today", label: "Vencem hoje", color: "var(--color-brand)" },
  { key: "due_next_7_days", label: "Próximos 7 dias", color: "color-mix(in oklab, var(--color-brand) 40%, transparent)" },
] as const;

/**
 * Client Component: as contas a pagar por janela de vencimento, numa barra única segmentada (a largura de cada pedaço é o valor) e, embaixo, uma
 * linha por janela com a cor, o nome, a quantidade e o valor. Sem eixos nem grade: os números estão ao lado, a barra só mostra a proporção.
 */
export function PayableWindows() {
  const { data } = useDashboardRetrieve();
  if (!data) return <Skeleton className="h-28 rounded-panel" />;

  const rows = WINDOWS.map((window) => ({ ...window, count: data.accounts_payable[window.key].count, value: Number(data.accounts_payable[window.key].total) }));
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  if (total <= 0) return <p className="text-body text-ink-soft">Nenhuma conta vencida nem a vencer nos próximos 7 dias.</p>;

  return (
    <div>
      <div className="flex h-3 gap-0.5" role="img" aria-label={rows.map((row) => `${row.label}: ${brlWhole(String(row.value))}`).join("; ")}>
        {rows
          .filter((row) => row.value > 0)
          .map((row) => (
            <span key={row.key} className="h-full first:rounded-l-full last:rounded-r-full" style={{ width: `${Math.max((row.value / total) * 100, 2)}%`, backgroundColor: row.color }} />
          ))}
      </div>
      <ul className="mt-4 space-y-1">
        {rows.map((row) => (
          <li key={row.key} className="flex items-center gap-3 py-1 text-body">
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: row.color }} aria-hidden />
            <span className="min-w-0 flex-1 truncate text-ink-soft">{row.label}</span>
            <span className="shrink-0 text-caption tabular-nums text-ink-faint">
              {row.count} conta{row.count === 1 ? "" : "s"}
            </span>
            <span className="w-28 shrink-0 text-right tabular-nums">{brlWhole(String(row.value))}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
