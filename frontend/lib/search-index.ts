/** Páginas e seções do painel pesquisáveis na busca global (filtradas no navegador). */
export interface StaticSearchItem {
  title: string;
  subtitle: string;
  href: string;
  keywords: string;
}

export const STATIC_SEARCH_ITEMS: StaticSearchItem[] = [
  { title: "Painel", subtitle: "Página", href: "/dashboard", keywords: "inicio home visao geral" },
  { title: "Condomínios", subtitle: "Página", href: "/condominiums", keywords: "lista cadastro" },
  { title: "Pessoas", subtitle: "Página", href: "/condominiums/persons", keywords: "lista cadastro proprietarios locatarios" },
  { title: "Blocos", subtitle: "Dentro de cada condomínio", href: "/condominiums", keywords: "torre bloco lista cadastro condominio" },
  { title: "Unidades", subtitle: "Condomínios", href: "/condominiums/units", keywords: "apartamento sala loja lista cadastro condominio fracao ideal" },
  { title: "Sub-contas", subtitle: "Dentro de cada condomínio", href: "/condominiums", keywords: "centro de custo plano de contas fundo reserva obras agua lista cadastro" },
  { title: "Nova unidade", subtitle: "Escolha o condomínio e use Nova", href: "/condominiums/units", keywords: "criar adicionar cadastrar apartamento" },
  { title: "Contas a pagar", subtitle: "Financeiro", href: "/finance/accounts-payable", keywords: "despesas baixa pagamento fornecedor vencimento cancelar" },
  { title: "Extrato", subtitle: "Financeiro", href: "/finance/statement", keywords: "conta corrente saldo lancamentos estorno condominio" },
  { title: "Lançamento manual", subtitle: "Financeiro", href: "/finance/entries/new", keywords: "lote tarifa ajuste credito debito conta corrente criar adicionar" },
  { title: "Planos de cobrança", subtitle: "Cobrança", href: "/billing/plans", keywords: "plano itens taxa condominial rateio fracao ideal boleto emissao vigencia" },
  { title: "Inclusão de valores", subtitle: "Cobrança", href: "/billing/entries", keywords: "lancamento valores boleto chamada extra agua tarifa rateio parcelado recorrencia sub-conta fundo obras reserva" },
  { title: "Eventos", subtitle: "Cobrança", href: "/billing/events", keywords: "evento codigo descricao lancamento limpeza" },
  { title: "Conta da imobiliária", subtitle: "Financeiro", href: "/finance/company-account", keywords: "tarifa registro banco receita imobiliaria saldo credito" },
  { title: "Documentos de cobrança", subtitle: "Cobrança", href: "/billing/documents", keywords: "boleto boletos emitidos unidade pagador vencido pdf cancelar" },
  { title: "Execuções da emissão", subtitle: "Cobrança", href: "/billing/runs", keywords: "emissao mensal problemas unidades puladas falhas" },
  { title: "Emitir mês", subtitle: "Cobrança", href: "/billing/runs", keywords: "emitir boletos agora condominio mes referencia" },
  { title: "Novo plano de cobrança", subtitle: "Cadastro", href: "/billing/plans/new", keywords: "criar adicionar cadastrar itens boleto" },
  { title: "Nova conta a pagar", subtitle: "Cadastro", href: "/finance/accounts-payable/new", keywords: "criar adicionar cadastrar despesa" },
  { title: "Novo condomínio", subtitle: "Cadastro", href: "/condominiums/new", keywords: "criar adicionar cadastrar" },
  { title: "Nova pessoa", subtitle: "Cadastro", href: "/condominiums/persons/new", keywords: "criar adicionar cadastrar" },
  { title: "Unidades com responsável", subtitle: "Painel · gráfico", href: "/dashboard?focus=responsibles", keywords: "pontos proprietario locatario cobrar vinculo grafico" },
  { title: "Reajustes", subtitle: "Painel · gráfico", href: "/dashboard?focus=adjustments", keywords: "barras atrasados proximos meses igpm incc contrato grafico" },
  { title: "Receita fixa mensal", subtitle: "Painel · gráfico", href: "/dashboard?focus=fixed-revenue", keywords: "taxa administracao dinheiro faturamento grafico" },
  { title: "Pendências", subtitle: "Painel", href: "/dashboard?focus=pending", keywords: "sem responsavel rateio fracao ideal reajuste locacao centros de custo plano de contas bloqueio atencao" },
  { title: "Resumo dos cadastros", subtitle: "Painel", href: "/dashboard?focus=condominiums", keywords: "total ativos condominios unidades pessoas" },
  { title: "Contas a pagar", subtitle: "Painel", href: "/dashboard?focus=accounts-payable", keywords: "despesas vencimento atrasadas vencem hoje fornecedor pagar" },
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
