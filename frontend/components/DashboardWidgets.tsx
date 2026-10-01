import Link from "next/link";

import { SimpleBarChart } from "@/components/charts/SimpleBarChart";
import { DotMatrix } from "@/components/DotMatrix";
import { LinkButton } from "@/components/LinkButton";
import { SeeAllLink } from "@/components/SeeAllLink";
import type { Dashboard } from "@/lib/api/generated/models";

export const WIDGET_IDS = [
  "condominios",
  "responsaveis",
  "reajustes",
  "receita-fixa",
  "pendencias",
] as const;

export type WidgetId = (typeof WIDGET_IDS)[number];

export interface Widget {
  title: string;
  description?: string;
  /** Classes de grade do card no painel. */
  className: string;
  /** Mostra o título/descrição no cabeçalho do card (o modal sempre mostra). */
  showHeader: boolean;
  /** Link "Ver todos" exibido ao passar o mouse no card. */
  seeAll?: { href: string };
  /** `large` = versão ampliada exibida no modal de foco. */
  render: (large: boolean) => React.ReactNode;
}

const brl = (value: number | string) =>
  Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Caption({ children }: { children: React.ReactNode }) {
  return <p className="text-caption text-ink-soft">{children}</p>;
}

function TypeList({ items }: { items: { rotulo: string; total: number }[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item.rotulo} className="flex justify-between">
          <span className="text-ink-soft">{item.rotulo}</span>
          <span className="tabular-nums">{item.total}</span>
        </li>
      ))}
    </ul>
  );
}

function monthLabel(value: string) {
  if (value === "atrasados") return "Atras.";
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1)
    .toLocaleDateString("pt-BR", { month: "short" })
    .replace(".", "");
}

function monthLabelLong(value: string) {
  if (value === "atrasados") return "Reajustes atrasados";
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export function buildWidgets(dash: Dashboard | undefined): Record<WidgetId, Widget> {
  const resp = dash?.responsaveis;
  const semResponsavel = resp ? resp.unidades_ativas - resp.com_responsavel : undefined;
  const receita = dash?.receita_fixa;

  return {
    condominios: {
      title: "Condomínios administrados",
      className: "lg:col-span-5",
      showHeader: false,
      render: (large) => (
        <>
          <div className="rounded-panel bg-surface-muted p-4">
            <Caption>Condomínios administrados</Caption>
            <div className="mt-1 text-display tabular-nums">{dash?.condominios.total ?? "–"}</div>
            <div className="mt-4 flex rounded-full bg-surface p-0.5">
              <LinkButton className="flex-1" href="/condominios/novo">
                Novo condomínio
              </LinkButton>
              <LinkButton className="flex-1" variant="ghost" href="/pessoas/novo">
                Nova pessoa
              </LinkButton>
            </div>
          </div>
          <div className="mt-4 flex items-start justify-between gap-6 px-1">
            <div>
              <Caption>Em operação</Caption>
              <div className="text-heading tabular-nums">
                {dash?.condominios.ativos ?? "–"}
                <span className="font-normal text-ink-faint"> de {dash?.condominios.total ?? "–"}</span>
              </div>
            </div>
            {large ? (
              <div className="min-w-40">
                <Caption>Por tipo</Caption>
                <TypeList items={dash?.condominios.por_tipo ?? []} />
              </div>
            ) : (
              <SeeAllLink href="/condominios" />
            )}
          </div>
        </>
      ),
    },

    responsaveis: {
      title: "Unidades com responsável",
      description: "Unidades ativas com proprietário ou locatário vinculado.",
      className: "lg:col-span-4",
      showHeader: true,
      render: (large) => (
        <>
          <DotMatrix
            filled={resp?.com_responsavel ?? 0}
            total={resp?.unidades_ativas ?? 0}
            columns={large ? 40 : 24}
            rows={large ? 10 : 6}
          />
          <div className="mt-4">
            <Caption>
              {semResponsavel === undefined
                ? "–"
                : semResponsavel === 0
                  ? "Todas as unidades têm responsável"
                  : `${semResponsavel} sem ninguém para cobrar`}
            </Caption>
            <div className="text-title tabular-nums">
              {resp?.com_responsavel ?? "–"}
              <span className="text-heading font-normal text-ink-faint"> de {resp?.unidades_ativas ?? "–"}</span>
            </div>
          </div>
        </>
      ),
    },

    reajustes: {
      title: "Reajustes",
      description: "Previstos nos próximos 6 meses",
      className: "lg:col-span-3",
      showHeader: true,
      render: (large) => (
        <SimpleBarChart
          data={(dash?.reajustes_por_mes ?? []).map((item) => ({
            label: monthLabel(item.mes),
            tooltipLabel: monthLabelLong(item.mes),
            value: item.total,
          }))}
          className={large ? "h-72 w-full" : "h-40 w-full"}
          highlightFirst
        />
      ),
    },

    "receita-fixa": {
      title: "Receita fixa mensal",
      description: "Taxa de administração dos condomínios com valor fixo",
      className: "lg:col-span-6",
      showHeader: true,
      render: (large) => (
        <>
          <div className="mb-4 flex flex-col items-start gap-1 md:flex-row md:items-end md:justify-between md:gap-4">
            <div className="text-display tabular-nums">{receita ? brl(receita.total_mensal) : "–"}</div>
            <Caption>
              {receita
                ? `${receita.condominios_fixos} com taxa fixa · ${receita.condominios_variaveis} com taxa variável (dependem do financeiro)`
                : ""}
            </Caption>
          </div>
          <SimpleBarChart
            horizontal
            data={(receita?.maiores ?? []).map((item) => ({ label: item.nome, value: Number(item.valor) }))}
            className={large ? "h-96 w-full" : "h-52 w-full"}
            format="currency"
          />
        </>
      ),
    },

    pendencias: {
      title: "Pendências",
      description: "O que pede ação, da mais crítica para a menos",
      className: "lg:col-span-6",
      showHeader: true,
      render: (large) => <Pendencias pendencias={dash?.pendencias} large={large} />,
    },
  };
}

function Pendencias({
  pendencias,
  large,
}: {
  pendencias: Dashboard["pendencias"] | undefined;
  large: boolean;
}) {
  // Ordem = criticidade para a cobrança: sem pagador e rateio errado quebram o boleto.
  const rows = [
    {
      count: pendencias?.unidades_sem_responsavel ?? 0,
      label: "Unidades sem responsável",
      detail: "Ativas, sem proprietário ou locatário: não há a quem cobrar",
      href: "/condominios",
    },
    {
      count: pendencias?.rateio_inconsistente ?? 0,
      label: "Rateio que não fecha 100%",
      detail: "Condomínios cuja soma das frações ideais é diferente de 100%",
      href: "/condominios",
    },
    {
      count: pendencias?.reajustes_atrasados ?? 0,
      label: "Reajustes atrasados",
      detail: "A data do próximo reajuste já passou",
      href: "/condominios",
    },
    {
      count: pendencias?.reajustes_30_dias ?? 0,
      label: "Reajustes em 30 dias",
      detail: "Condomínios com reajuste previsto no próximo mês",
      href: "/condominios",
    },
    {
      count: pendencias?.locacoes_terminando ?? 0,
      label: "Locações terminando",
      detail: "Vínculos de locatário que terminam em até 60 dias (ou já encerraram)",
      href: "/condominios",
    },
    {
      count: pendencias?.sem_plano_contas ?? 0,
      label: "Sem plano de contas",
      detail: "Condomínios sem sub-contas: bloqueiam o financeiro",
      href: "/condominios",
    },
    {
      count: pendencias?.lancamentos_bloqueados ?? 0,
      label: "Lançamentos bloqueados",
      detail: "Unidades com bloqueio de lançamentos",
      href: "/condominios",
    },
  ];
  const total = rows.reduce((sum, row) => sum + row.count, 0);

  if (pendencias && total === 0) {
    return <p className="py-6 text-ink-soft">Nenhuma pendência. Tudo em dia.</p>;
  }

  return (
    <ul className="-mx-2 space-y-0.5">
      {rows.map((row) => (
        <li key={row.label}>
          <Link
            href={row.href}
            className="flex items-center justify-between gap-3 rounded-panel px-3 py-2 transition-colors hover:bg-surface-muted"
          >
            <div className="min-w-0">
              <div className={`truncate ${row.count > 0 ? "font-medium" : "text-ink-faint"}`}>
                {row.label}
              </div>
              {large && <div className="text-caption text-ink-soft">{row.detail}</div>}
            </div>
            <span
              className={`text-heading tabular-nums ${row.count > 0 ? "text-ink" : "text-ink-faint"}`}
            >
              {pendencias ? row.count : "–"}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

