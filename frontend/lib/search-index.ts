/** Páginas e seções do painel pesquisáveis na busca global (filtradas no navegador). */
export interface StaticSearchItem {
  title: string;
  subtitle: string;
  href: string;
  keywords: string;
}

export const STATIC_SEARCH_ITEMS: StaticSearchItem[] = [
  { title: "Painel", subtitle: "Página", href: "/", keywords: "inicio home visao geral" },
  { title: "Condomínios", subtitle: "Página", href: "/condominiums", keywords: "lista cadastro" },
  { title: "Pessoas", subtitle: "Página", href: "/persons", keywords: "lista cadastro proprietarios locatarios" },
  { title: "Novo condomínio", subtitle: "Cadastro", href: "/condominiums/new", keywords: "criar adicionar cadastrar" },
  { title: "Nova pessoa", subtitle: "Cadastro", href: "/persons/new", keywords: "criar adicionar cadastrar" },
  { title: "Unidades com responsável", subtitle: "Painel · gráfico", href: "/?focus=responsibles", keywords: "pontos proprietario locatario cobrar vinculo grafico" },
  { title: "Reajustes", subtitle: "Painel · gráfico", href: "/?focus=adjustments", keywords: "barras atrasados proximos meses igpm incc contrato grafico" },
  { title: "Receita fixa mensal", subtitle: "Painel · gráfico", href: "/?focus=revenue-fixa", keywords: "taxa administracao dinheiro faturamento grafico" },
  { title: "Pendências", subtitle: "Painel", href: "/?focus=pending", keywords: "sem responsavel rateio fracao ideal reajuste locacao centros de custo plano de contas bloqueio atencao" },
  { title: "Condomínios administrados", subtitle: "Painel", href: "/?focus=condominiums", keywords: "total ativos grafico" },
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

/** Mesma regra do backend (apps/core/views/search_views.py): 3 caracteres, ou 2 se for numérico. */
const NUMERIC_TERM = /^[\d.\-/\s]+$/;
export const MIN_TEXT_LENGTH = 3;
export const MIN_NUMERIC_LENGTH = 2;

export function isSearchable(term: string) {
  const value = term.trim();
  if (NUMERIC_TERM.test(value)) return value.replace(/\D/g, "").length >= MIN_NUMERIC_LENGTH;
  return value.length >= MIN_TEXT_LENGTH;
}
