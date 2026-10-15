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
  { title: "Contas a pagar", subtitle: "Financeiro", href: "/finance/accounts-payable", keywords: "despesas baixa pagamento fornecedor vencimento cancelar" },
  { title: "Extrato", subtitle: "Financeiro", href: "/finance/statement", keywords: "conta corrente saldo lancamentos estorno condominio" },
  { title: "Lançamento manual", subtitle: "Financeiro", href: "/finance/entries/new", keywords: "lote tarifa ajuste credito debito conta corrente criar adicionar" },
  { title: "Nova conta a pagar", subtitle: "Cadastro", href: "/finance/accounts-payable/new", keywords: "criar adicionar cadastrar despesa" },
  { title: "Novo condomínio", subtitle: "Cadastro", href: "/condominiums/new", keywords: "criar adicionar cadastrar" },
  { title: "Nova pessoa", subtitle: "Cadastro", href: "/persons/new", keywords: "criar adicionar cadastrar" },
  { title: "Unidades com responsável", subtitle: "Painel · gráfico", href: "/?focus=responsibles", keywords: "pontos proprietario locatario cobrar vinculo grafico" },
  { title: "Reajustes", subtitle: "Painel · gráfico", href: "/?focus=adjustments", keywords: "barras atrasados proximos meses igpm incc contrato grafico" },
  { title: "Receita fixa mensal", subtitle: "Painel · gráfico", href: "/?focus=fixed-revenue", keywords: "taxa administracao dinheiro faturamento grafico" },
  { title: "Pendências", subtitle: "Painel", href: "/?focus=pending", keywords: "sem responsavel rateio fracao ideal reajuste locacao centros de custo plano de contas bloqueio atencao" },
  { title: "Resumo dos cadastros", subtitle: "Painel", href: "/?focus=condominiums", keywords: "total ativos condominios unidades pessoas" },
  { title: "Contas a pagar", subtitle: "Painel", href: "/?focus=accounts-payable", keywords: "despesas vencimento atrasadas vencem hoje fornecedor pagar" },
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

/**
 * Same rule as the backend (apps/core/views/search/term.py): 3 characters, 2 if numeric, and a
 * term of only digits is an ID, so even a single digit is searchable.
 */
const NUMERIC_TERM = /^[\d.\-/\s]+$/;
const ID_TERM = /^\d+$/;
export const MIN_TEXT_LENGTH = 3;
export const MIN_NUMERIC_LENGTH = 2;

export function isSearchable(term: string) {
  const value = term.trim();
  if (ID_TERM.test(value)) return true;
  if (NUMERIC_TERM.test(value)) return value.replace(/\D/g, "").length >= MIN_NUMERIC_LENGTH;
  return value.length >= MIN_TEXT_LENGTH;
}
