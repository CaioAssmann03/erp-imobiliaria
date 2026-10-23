"use client";

import { useSearchParams } from "next/navigation";

import { useDashboardRetrieve } from "@/lib/api/generated";

import { EndingLeases } from "./EndingLeases";
import { FocusModal } from "./FocusModal";
import { SeeAllLink } from "./SeeAllLink";
import { UpcomingAdjustments } from "./UpcomingAdjustments";
import { WidgetCard } from "./WidgetCard";
import { buildWidgets, WIDGET_IDS, type WidgetId } from "./widgets";

/** Client Component: os cards do painel e o destaque (`?focus=`). Falha ou carga mostram "–" em vez de derrubar o painel. */
export function DashboardHome() {
  const focus = useSearchParams().get("focus");
  const { data: dash } = useDashboardRetrieve();

  const widgets = buildWidgets(dash);
  const focused = WIDGET_IDS.includes(focus as WidgetId) ? widgets[focus as WidgetId] : undefined;

  return (
    <>
      {focused && (
        <FocusModal title={focused.title} description={focused.description}>
          {focused.renderFocus ? focused.renderFocus() : focused.render(true)}
        </FocusModal>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {WIDGET_IDS.map((id) => {
          const widget = widgets[id];
          return (
            <WidgetCard key={id} id={id} className={`gap-4 ${widget.className}`}>
              {widget.showHeader && (
                <div className="flex items-start justify-between px-5">
                  <h2 className="text-heading">{widget.title}</h2>
                  {widget.seeAll && <SeeAllLink href={widget.seeAll.href} />}
                </div>
              )}
              <div className="px-5">{widget.render(false)}</div>
            </WidgetCard>
          );
        })}

        <div className="grid grid-cols-1 gap-4 lg:col-span-12 lg:grid-cols-2">
          <UpcomingAdjustments adjustments={dash?.upcoming_adjustments ?? []} />
          <EndingLeases leases={dash?.leases ?? []} />
        </div>
      </div>
    </>
  );
}
