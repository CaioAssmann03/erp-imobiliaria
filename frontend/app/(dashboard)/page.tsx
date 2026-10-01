import { buildWidgets, WIDGET_IDS, type WidgetId } from "@/components/DashboardWidgets";
import { FocusModal } from "@/components/FocusModal";
import { Greeting } from "@/components/Greeting";
import { PageHeader } from "@/components/PageHeader";
import { RecentList } from "@/components/RecentList";
import { SeeAllLink } from "@/components/SeeAllLink";
import { Card } from "@/components/ui/card";
import {
  getCondominiosListQueryOptions,
  getDashboardRetrieveQueryOptions,
  getPessoasListQueryOptions,
} from "@/lib/api/generated";
import { getServerQueryClient } from "@/lib/query/server";

const LIST_SIZE = 6;

export default async function DashboardHomePage({
  searchParams,
}: {
  searchParams: Promise<{ foco?: string }>;
}) {
  const { foco } = await searchParams;
  const queryClient = getServerQueryClient();
  const load = <T,>(promise: Promise<T>) => promise.catch(() => undefined);

  // Buscas no servidor via TanStack Query. Falhas degradam para "–".
  const [dash, condominios, pessoas] = await Promise.all([
    load(queryClient.fetchQuery(getDashboardRetrieveQueryOptions())),
    load(queryClient.fetchQuery(getCondominiosListQueryOptions({}))),
    load(queryClient.fetchQuery(getPessoasListQueryOptions({}))),
  ]);

  const widgets = buildWidgets(dash);
  const focused = WIDGET_IDS.includes(foco as WidgetId) ? widgets[foco as WidgetId] : undefined;

  return (
    <div>
      <PageHeader
        title={<Greeting />}
        description="Visão geral da administração de condomínios, locações, vendas e financeiro."
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
            <Card key={id} id={id} className={`gap-4 ${widget.className}`}>
              {widget.showHeader && (
                <div className="flex items-start justify-between px-5">
                  <div>
                    <h2 className="text-heading">{widget.title}</h2>
                    {widget.description && (
                      <p className="text-caption text-ink-soft">{widget.description}</p>
                    )}
                  </div>
                  {widget.seeAll && <SeeAllLink href={widget.seeAll.href} />}
                </div>
              )}
              <div className="px-5">{widget.render(false)}</div>
            </Card>
          );
        })}

        {/* Listas */}
        <div className="grid grid-cols-1 gap-4 lg:col-span-12 lg:grid-cols-2">
          <RecentList
            title="Condomínios"
            count={condominios?.count}
            allHref="/condominios"
            metaLabel="Cidade"
            items={(condominios?.results ?? []).slice(0, LIST_SIZE).map((c) => ({
              id: c.id,
              name: c.nome,
              sub: c.cnpj,
              meta: c.cidade ? `${c.cidade}/${c.uf}` : null,
              ativo: c.ativo,
              href: `/condominios/${c.id}`,
            }))}
          />
          <RecentList
            title="Pessoas"
            count={pessoas?.count}
            allHref="/pessoas"
            metaLabel="Celular"
            items={(pessoas?.results ?? []).slice(0, LIST_SIZE).map((p) => ({
              id: p.id,
              name: p.nome,
              sub: p.email || p.cpf_cnpj,
              meta: p.celular,
              ativo: p.ativo,
              href: `/pessoas/${p.id}`,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
