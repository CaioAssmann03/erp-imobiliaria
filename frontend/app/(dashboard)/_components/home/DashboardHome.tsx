"use client";

import { useSearchParams } from "next/navigation";

import { useDashboardRetrieve } from "@/lib/api/generated";

import { FocusModal } from "./card/FocusModal";
import { SeeAllLink } from "./shared/SeeAllLink";
import { UpcomingAdjustments } from "./bodies/UpcomingAdjustments";
import { WidgetCard } from "./card/WidgetCard";
import { useDashboardEdit } from "./layout/DashboardEditProvider";
import { DraggableSlot } from "./layout/DraggableSlot";
import { EditBar } from "./layout/EditBar";
import { itemInfo } from "./layout/item-info";
import { useDashboardLayout } from "./layout/use-dashboard-layout";
import { buildWidgets, WIDGET_IDS, type WidgetId } from "./widgets";

/** Client Component: os cards do painel e o destaque (`?focus=`). Falha ou carga mostram "–" em vez de derrubar o painel. */
export function DashboardHome() {
  const focus = useSearchParams().get("focus");
  const { data: dash } = useDashboardRetrieve();
  const { visible } = useDashboardLayout();
  const { editing } = useDashboardEdit();

  const widgets = buildWidgets(dash);
  const focused = WIDGET_IDS.includes(focus as WidgetId) ? widgets[focus as WidgetId] : undefined;

  const card = (id: WidgetId) => {
    const widget = widgets[id];
    return (
      <WidgetCard key={id} id={id} className="h-full gap-4">
        {widget.showHeader && (
          <div className="flex items-start justify-between px-5">
            <h2 className="text-heading">{widget.title}</h2>
            {widget.seeAll && <SeeAllLink href={widget.seeAll.href} />}
          </div>
        )}
        <div className="flex flex-1 flex-col px-5">{widget.render(false)}</div>
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

      {/* O resumo dos cadastros vive no cabeçalho da página (`RegistrySummary`). Responsáveis e a lista de reajustes por mês só aparecem em
          destaque (`?focus=`) e na busca: o painel mostra o que pede ação hoje e o que entra e sai de dinheiro. A ordem e quais widgets aparecem
          são da pessoa (`layout/`), com este mesmo conjunto de widgets como padrão. */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
        {visible.map((id) => (
          <DraggableSlot key={id} id={id} title={itemInfo(id).title}>
            {id === "upcoming-adjustments" ? <UpcomingAdjustments adjustments={dash?.upcoming_adjustments ?? []} /> : card(id)}
          </DraggableSlot>
        ))}
        {visible.length === 0 && (
          <p className="col-span-full py-10 text-center text-ink-soft">Nenhum widget no painel. Use o ícone de personalizar, no alto da página, para adicionar.</p>
        )}
      </div>
      {editing && <EditBar />}
    </>
  );
}
