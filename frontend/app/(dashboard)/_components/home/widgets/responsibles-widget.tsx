import { ResponsiblesDonut } from "../ResponsiblesDonut";
import { Caption } from "./Caption";
import { ResponsiblesFocus } from "./focus/ResponsiblesFocus";
import type { WidgetBuilder } from "./types";

export const buildResponsiblesWidget: WidgetBuilder = (dash) => {
  const stats = dash?.responsibles;
  const withoutResponsible = stats ? stats.active_units - stats.with_responsible : undefined;

  return {
    title: "Unidades com responsável",
    description: "Unidades ativas com proprietário ou locatário vinculado.",
    className: "lg:col-span-4",
    showHeader: true,
    renderFocus: () => <ResponsiblesFocus stats={stats} />,
    render: () => (
      <>
        <ResponsiblesDonut covered={stats?.with_responsible ?? 0} total={stats?.active_units ?? 0} />
        <div className="mt-3 text-center">
          <Caption>
            {withoutResponsible === undefined
              ? "–"
              : withoutResponsible === 0
                ? "Todas as unidades têm responsável"
                : `${withoutResponsible} sem ninguém para cobrar`}
          </Caption>
        </div>
      </>
    ),
  };
};
