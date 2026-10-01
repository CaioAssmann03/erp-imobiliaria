/** Páginas e seções do painel pesquisáveis na busca global (filtradas no navegador). */
export interface StaticSearchItem {
  title: string;
  subtitle: string;
  href: string;
  keywords: string;
}

export const STATIC_SEARCH_ITEMS: StaticSearchItem[] = [
  { title: "Painel", subtitle: "Página", href: "/", keywords: "inicio home visao geral" },
  { title: "Condomínios", subtitle: "Página", href: "/condominios", keywords: "lista cadastro" },
  { title: "Pessoas", subtitle: "Página", href: "/pessoas", keywords: "lista cadastro proprietarios locatarios" },
  { title: "Novo condomínio", subtitle: "Cadastro", href: "/condominios/novo", keywords: "criar adicionar cadastrar" },
  { title: "Nova pessoa", subtitle: "Cadastro", href: "/pessoas/novo", keywords: "criar adicionar cadastrar" },
  { title: "Unidades com responsável", subtitle: "Painel · gráfico", href: "/?foco=responsaveis", keywords: "pontos proprietario locatario cobrar vinculo grafico" },
  { title: "Reajustes", subtitle: "Painel · gráfico", href: "/?foco=reajustes", keywords: "barras atrasados proximos meses igpm incc contrato grafico" },
  { title: "Receita fixa mensal", subtitle: "Painel · gráfico", href: "/?foco=receita-fixa", keywords: "taxa administracao dinheiro faturamento grafico" },
  { title: "Pendências", subtitle: "Painel", href: "/?foco=pendencias", keywords: "sem responsavel rateio fracao ideal reajuste locacao plano de contas bloqueio atencao" },
  { title: "Condomínios administrados", subtitle: "Painel", href: "/?foco=condominios", keywords: "total ativos grafico" },
];

export function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function searchStatic(term: string): StaticSearchItem[] {
  const needle = normalize(term.trim());
  if (!needle) return [];
  return STATIC_SEARCH_ITEMS.filter((item) =>
    normalize(`${item.title} ${item.keywords}`).includes(needle)
  ).slice(0, 5);
}

/** Mesma regra do backend (apps/core/search.py): 3 caracteres, ou 2 se for numérico. */
const NUMERIC_TERM = /^[\d.\-/\s]+$/;
export const MIN_TEXT_LENGTH = 3;
export const MIN_NUMERIC_LENGTH = 2;

export function isSearchable(term: string) {
  const value = term.trim();
  if (NUMERIC_TERM.test(value)) return value.replace(/\D/g, "").length >= MIN_NUMERIC_LENGTH;
  return value.length >= MIN_TEXT_LENGTH;
}
