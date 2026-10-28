export interface Feature {
  title: string;
  description: string;
}

export interface Step {
  title: string;
  description: string;
}

/** Destino dos botões "Agendar demonstração". Provisório: trocar pelo canal real de contato (e-mail, WhatsApp, formulário). */
export const CONTACT_HREF = "/#contato";

export const NAV_LINKS = [
  { href: "/features", label: "Recursos" },
  { href: "/how-it-works", label: "Como funciona" },
  { href: "/#contato", label: "Contato" },
] as const;

/** Texto da seção logo abaixo do hero (`Statement`), uma frase por linha de entrada. */
export const STATEMENT = [
  "Na maioria das administradoras, a rotina de um condomínio vive espalhada entre planilhas, bancos e e-mails.",
  "Aqui, cadastro, cobrança, conciliação e financeiro ficam no mesmo lugar, ligados entre si.",
  "O boleto emitido é o mesmo que o banco baixa e o mesmo que aparece no extrato do mês.",
  "Menos conferência manual, mais tempo para atender quem mora no condomínio.",
];

export const FEATURES: Feature[] = [
  {
    title: "Condomínios, blocos e unidades",
    description: "Toda a estrutura do condomínio em um só lugar, com filtros e pendências à vista.",
  },
  {
    title: "Pessoas e proprietários",
    description: "Cadastro único de moradores, proprietários e fornecedores, com busca instantânea.",
  },
  {
    title: "Cobrança automatizada",
    description: "Planos de cobrança, emissão mensal em lote e boletos gerados sem planilhas.",
  },
  {
    title: "Baixa e conciliação",
    description: "Pagamentos confirmados por webhook e conciliados automaticamente com o extrato.",
  },
  {
    title: "Contas a pagar",
    description: "Despesas por centro de custo, baixa com um clique e histórico completo.",
  },
  {
    title: "Documentos e PDFs",
    description: "Segunda via, cancelamento e envio por e-mail direto da tela do documento.",
  },
];

export const STEPS: Step[] = [
  {
    title: "Cadastre o condomínio",
    description: "Importe ou cadastre condomínios, blocos, unidades e as pessoas ligadas a cada uma.",
  },
  {
    title: "Defina os planos de cobrança",
    description: "Monte taxas e itens por condomínio, uma única vez, e reaproveite todo mês.",
  },
  {
    title: "Emita o mês com um clique",
    description: "O sistema gera os documentos de todas as unidades e registra os boletos.",
  },
  {
    title: "Acompanhe e concilie",
    description: "Receba as baixas em tempo real e feche o extrato sem digitar nada.",
  },
];

