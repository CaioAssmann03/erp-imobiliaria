import { DotMatrix } from "../DotMatrix";
import { Caption } from "./Caption";
import type { WidgetBuilder } from "./types";

export const buildResponsiblesWidget: WidgetBuilder = (dash) => {
  const stats = dash?.responsibles;
  const withoutResponsible = stats ? stats.active_units - stats.with_responsible : undefined;

  return {
    title: "Unidades com responsável",
    description: "Unidades ativas com proprietário ou locatário vinculado.",
    className: "lg:col-span-4",
    showHeader: true,
    render: (large) => (
      <>
        <DotMatrix
          filled={stats?.with_responsible ?? 0}
          total={stats?.active_units ?? 0}
          columns={large ? 40 : 24}
          rows={large ? 10 : 6}
        />
        <div className="mt-4">
          <Caption>
            {withoutResponsible === undefined
              ? "–"
              : withoutResponsible === 0
                ? "Todas as unidades têm responsável"
                : `${withoutResponsible} sem ninguém para cobrar`}
          </Caption>
          <div className="text-title tabular-nums">
            {stats?.with_responsible ?? "–"}
            <span className="text-heading font-normal text-ink-faint"> de {stats?.active_units ?? "–"}</span>
          </div>
        </div>
      </>
    ),
  };
};
