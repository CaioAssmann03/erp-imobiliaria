import type { Metadata } from "next";

import { getDashboardRetrieveQueryOptions } from "@/lib/api/generated";
import { PageHeader } from "@/components/PageHeader";
import { getServerQueryClient } from "@/lib/query/server";

import { EndingLeases } from "./_components/home/EndingLeases";
import { FocusModal } from "./_components/home/FocusModal";
import { Greeting } from "./_components/home/Greeting";
import { SeeAllLink } from "./_components/home/SeeAllLink";
import { UpcomingAdjustments } from "./_components/home/UpcomingAdjustments";
import { WidgetCard } from "./_components/home/WidgetCard";
import { buildWidgets, WIDGET_IDS, type WidgetId } from "./_components/home/widgets";

export const metadata: Metadata = { title: "Painel" };

export default async function DashboardHomePage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string }>;
}) {
  const { focus } = await searchParams;
  const queryClient = getServerQueryClient();

  // Busca no servidor via TanStack Query. Falha degrada para "–" em vez de derrubar o painel.
  const dash = await queryClient.fetchQuery(getDashboardRetrieveQueryOptions()).catch(() => undefined);

  const widgets = buildWidgets(dash);
  const focused = WIDGET_IDS.includes(focus as WidgetId) ? widgets[focus as WidgetId] : undefined;

  return (
    <div>
      <PageHeader
        title={<Greeting />}
        description="O que pede atenção na administração de condomínios, locações, vendas e financeiro."
      />

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
    </div>
  );
}
