/** Ícone de um item do menu; quem desenha (Rail, ModuleMenu) liga cada chave a um ícone. */
export type MenuIcon =
  | "building"
  | "door"
  | "users"
  | "layers"
  | "home"
  | "file"
  | "folder"
  | "percent"
  | "receipt"
  | "wallet"
  | "list"
  | "play"
  | "landmark"
  | "plus";

export interface MenuItem {
  label: string;
  description: string;
  icon: MenuIcon;
  /** Sem `href` a tela ainda não existe: o item aparece desativado com "Em breve". */
  href?: string;
}

export interface MenuGroup {
  title: string;
  items: readonly MenuItem[];
}

export type ModuleKey = "home" | "condominiums" | "finance" | "billing";

export interface AppModule {
  key: ModuleKey;
  label: string;
  icon: "dashboard" | "building" | "wallet" | "receipt" | "users";
  /** Prefixo da URL que torna o módulo o ativo. */
  prefix: string;
  /** Link direto (sem menu) quando o módulo não tem grupos. */
  href?: string;
  groups: readonly MenuGroup[];
}

export const APP_MODULES: readonly AppModule[] = [
  { key: "home", label: "Painel", icon: "dashboard", prefix: "/dashboard", href: "/dashboard", groups: [] },
  {
    key: "condominiums",
    label: "Condomínios",
    icon: "building",
    prefix: "/condominiums",
    groups: [
      {
        title: "Cadastros",
        items: [
          { label: "Condomínios", description: "Cadastro e ficha completa", icon: "building", href: "/condominiums" },
          { label: "Unidades", description: "Apartamentos, salas e garagens", icon: "door", href: "/condominiums/units" },
          { label: "Pessoas", description: "Proprietários, inquilinos e síndicos", icon: "users", href: "/condominiums/persons" },
          { label: "Eventos", description: "Itens que entram no boleto", icon: "layers", href: "/billing/events" },
          { label: "Áreas", description: "Áreas comuns e reservas", icon: "home" },
        ],
      },
      {
        title: "Relatórios",
        items: [
          { label: "Ficha da unidade", description: "Tudo de uma unidade em uma página", icon: "file" },
          { label: "Relatórios", description: "Todos os relatórios do sistema", icon: "folder" },
          { label: "Taxa de administração", description: "Cobrança por condomínio", icon: "percent" },
          { label: "Inadimplência", description: "Boletos vencidos e não pagos", icon: "receipt" },
          { label: "Prestação de contas", description: "Receitas e despesas do mês", icon: "wallet" },
        ],
      },
    ],
  },
  {
    key: "finance",
    label: "Financeiro",
    icon: "wallet",
    prefix: "/finance",
    groups: [
      {
        title: "Lançamentos",
        items: [
          { label: "Contas a pagar", description: "Despesas a pagar e baixadas", icon: "list", href: "/finance/accounts-payable" },
          { label: "Extrato", description: "Movimento de cada condomínio", icon: "file", href: "/finance/statement" },
          { label: "Lançamento manual", description: "Créditos e débitos avulsos", icon: "plus", href: "/finance/entries/new" },
          { label: "Conta da imobiliária", description: "Tarifas recebidas pela administradora", icon: "landmark", href: "/finance/company-account" },
        ],
      },
    ],
  },
  {
    key: "billing",
    label: "Cobrança",
    icon: "receipt",
    prefix: "/billing",
    groups: [
      {
        title: "Cobrança",
        items: [
          { label: "Inclusão de valores", description: "Lançar valores no boleto do mês", icon: "plus", href: "/billing/entries" },
          { label: "Planos de cobrança", description: "Itens fixos de cada condomínio", icon: "list", href: "/billing/plans" },
          { label: "Documentos", description: "Boletos emitidos", icon: "file", href: "/billing/documents" },
          { label: "Execuções", description: "Emissões do mês e problemas", icon: "play", href: "/billing/runs" },
          { label: "Eventos", description: "Itens que entram no boleto", icon: "layers", href: "/billing/events" },
        ],
      },
    ],
  },
];

/** Módulo da rota aberta (ou `null` na tela de login e em rotas desconhecidas). */
export function activeModule(pathname: string | null): ModuleKey | null {
  if (!pathname) return null;
  const found = APP_MODULES.find((appModule) => pathname.startsWith(appModule.prefix));
  return found?.key ?? null;
}

/** Item ativo: a URL é a dele ou está dentro dela; o item mais específico vence (Unidades dentro de /condominiums). */
export function isItemActive(item: MenuItem, siblings: readonly MenuItem[], pathname: string | null) {
  if (!item.href || !pathname) return false;
  const matches = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  if (!matches(item.href)) return false;
  const moreSpecific = siblings.some(
    (other) => other.href && other.href !== item.href && other.href.startsWith(`${item.href}/`) && matches(other.href)
  );
  return !moreSpecific;
}
