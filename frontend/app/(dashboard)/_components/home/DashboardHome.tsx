"use client";

import { useSearchParams } from "next/navigation";

import { useDashboardRetrieve } from "@/lib/api/generated";
import { cn } from "@/lib/utils";

import { FocusModal } from "./card/FocusModal";
import { SeeAllLink } from "./shared/SeeAllLink";
import { UpcomingAdjustments } from "./bodies/UpcomingAdjustments";
import { WidgetCard } from "./card/WidgetCard";
import { buildWidgets, WIDGET_IDS, type WidgetId } from "./widgets";

/** Client Component: os cards do painel e o destaque (`?focus=`). Falha ou carga mostram "–" em vez de derrubar o painel. */
export function DashboardHome() {
  const focus = useSearchParams().get("focus");
  const { data: dash } = useDashboardRetrieve();

  const widgets = buildWidgets(dash);
  const focused = WIDGET_IDS.includes(focus as WidgetId) ? widgets[focus as WidgetId] : undefined;

  const card = (id: WidgetId, className?: string) => {
    const widget = widgets[id];
    return (
      <WidgetCard key={id} id={id} className={cn("gap-4", className)}>
        {widget.showHeader && (
          <div className="flex items-start justify-between px-5">
            <h2 className="text-heading">{widget.title}</h2>
            {widget.seeAll && <SeeAllLink href={widget.seeAll.href} />}
          </div>
        )}
        <div className="px-5">{widget.render(false)}</div>
      </WidgetCard>
    );
  };

  return (
    <>
      {focused && (
        <FocusModal title={focused.title} description={focused.description}>
          {focused.renderFocus ? focused.renderFocus() : focused.render(true)}
        </FocusModal>
      )}

      {/* O resumo dos cadastros vive no cabeçalho da página (`RegistrySummary`). Reajustes, responsáveis e receita fixa só aparecem em
          destaque (`?focus=`) e na busca: o painel mostra o que pede ação hoje e o que entra e sai de dinheiro. */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
        {/* O que entra e o que sai, lado a lado: a receber (emissão e inadimplência) e a pagar. */}
        {card("billing-month", "lg:col-span-4")}
        {card("delinquency", "lg:col-span-4")}
        {card("accounts-payable", "md:col-span-2 lg:col-span-4")}
        {/* A tendência e o que pede ação. */}
        {card("billing-chart", "md:col-span-2 lg:col-span-8")}
        {card("pending", "md:col-span-2 lg:col-span-4")}
        <div className="md:col-span-2 lg:col-span-12">
          <UpcomingAdjustments adjustments={dash?.upcoming_adjustments ?? []} />
        </div>
      </div>
    </>
  );
}
