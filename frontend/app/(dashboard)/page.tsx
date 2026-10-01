import { buildWidgets, WIDGET_IDS, type WidgetId } from "@/components/DashboardWidgets";
import { FocusModal } from "@/components/FocusModal";
import { Greeting } from "@/components/Greeting";
import { PageHeader } from "@/components/PageHeader";
import { RecentList } from "@/components/RecentList";
import { WidgetCard } from "@/components/WidgetCard";
import { SeeAllLink } from "@/components/SeeAllLink";
import { getDashboardRetrieveQueryOptions } from "@/lib/api/generated";
import { getServerQueryClient } from "@/lib/query/server";

const DAY = 86_400_000;

function formatDate(iso: string) {
  return iso.split("-").reverse().join("/");
}

/** "em 9 dias" / "hoje" / "há 12 dias", a partir de uma data ISO (AAAA-MM-DD). */
function relativeDays(iso: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((new Date(`${iso}T00:00:00`).getTime() - today.getTime()) / DAY);
  if (days === 0) return "hoje";
  return days > 0 ? `em ${days} dia${days > 1 ? "s" : ""}` : `há ${-days} dia${days < -1 ? "s" : ""}`;
}

function Late({ children }: { children: React.ReactNode }) {
  return <span className="text-danger">{children}</span>;
}

export default async function DashboardHomePage({
  searchParams,
}: {
  searchParams: Promise<{ foco?: string }>;
}) {
  const { foco } = await searchParams;
  const queryClient = getServerQueryClient();

  // Busca no servidor via TanStack Query. Falha degrada para "–" em vez de derrubar o painel.
  const dash = await queryClient.fetchQuery(getDashboardRetrieveQueryOptions()).catch(() => undefined);

  const widgets = buildWidgets(dash);
  const focused = WIDGET_IDS.includes(foco as WidgetId) ? widgets[foco as WidgetId] : undefined;

  return (
    <div>
      <PageHeader
        title={<Greeting />}
        description="O que pede atenção na administração de condomínios, locações, vendas e financeiro."
      />

      {focused && (
        <FocusModal title={focused.title} description={focused.description}>
          {focused.render(true)}
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
          <RecentList
            title="Próximos reajustes"
            allHref="/condominios"
            metaLabel="Data"
            extraLabel="Prazo"
            emptyText="Nenhum condomínio com reajuste configurado."
            items={(dash?.proximos_reajustes ?? []).map((r) => ({
              id: r.id,
              name: r.nome,
              meta: `${formatDate(r.data)}${r.indice ? ` · ${r.indice}` : ""}`,
              extra: r.atrasado ? <Late>{relativeDays(r.data)}</Late> : relativeDays(r.data),
              href: `/condominios/${r.id}`,
            }))}
          />
          <RecentList
            title="Locações a vencer"
            allHref="/condominios"
            metaLabel="Locatário"
            extraLabel="Fim"
            emptyText="Nenhuma locação termina nos próximos 60 dias."
            items={(dash?.locacoes ?? []).map((l) => ({
              id: l.id,
              name: `Unidade ${l.unidade} · ${l.condominio_nome}`,
              meta: l.locatario,
              // Já encerrada: só "há 12 dias" em vermelho (a cor já diz que passou do prazo).
              extra: l.encerrada ? <Late>{relativeDays(l.data_fim)}</Late> : relativeDays(l.data_fim),
              href: `/condominios/${l.condominio}/unidades/${l.id}`,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
