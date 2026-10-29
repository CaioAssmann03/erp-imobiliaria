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

/**
 * Resumo logo abaixo do hero (`Summary`): um texto formal e justificado sobre o que é o sistema, um parágrafo de
 * abertura e os demais em duas colunas. Só afirma o que o sistema faz (ver `FEATURES` e `STEPS`), sem números inventados.
 */
export const SUMMARY = {
  lead: "O METRI é um sistema de gestão desenvolvido para administradoras de condomínios. Reúne, em uma única plataforma, o cadastro de condomínios, blocos, unidades e pessoas, a cobrança mensal, a conciliação bancária e o financeiro de cada condomínio administrado.",
  paragraphs: [
    "O cadastro é mantido uma única vez e serve de base para todas as demais rotinas. A partir dele, a administradora define os planos de cobrança de cada condomínio, emite os documentos do mês em lote para todas as unidades e registra os boletos correspondentes, sem a necessidade de planilhas intermediárias.",
    "Os pagamentos são recebidos do banco por meio de baixa automática e conciliados com o extrato, de modo que o boleto emitido, o valor baixado e o lançamento do mês refiram-se sempre ao mesmo registro. As despesas são lançadas por centro de custo, com contas a pagar, baixa e histórico completo.",
    "O resultado é uma operação rastreável, com menos conferência manual e informação consistente entre as áreas, o que permite à equipe dedicar mais tempo ao atendimento de quem mora e trabalha nos condomínios.",
  ],
};

/** Seção do mapa do Brasil (`GlobeSection`): administrar condomínios de vários lugares num só painel. */
export const GLOBE = {
  title: "Condomínios de todo o Brasil, no mesmo sistema.",
  text: "Cadastre condomínios de cidades e estados diferentes e acompanhe cobrança, conciliação e financeiro de todos em um só lugar, sem trocar de sistema nem de planilha.",
};

/**
 * Cards clicáveis (`Questions`): o título é uma pergunta, o clique mostra a resposta. A ordem é a do desenho (ver o
 * mapa de áreas em `Questions.tsx`). Só afirma o que o sistema faz; as respostas têm de caber no card do seu tamanho.
 */
export const QUESTIONS = {
  title: "Entenda cada parte do sistema.",
  items: [
    {
      title: "O que o sistema faz?",
      text: "Reúne, numa só plataforma, o cadastro de condomínios, blocos, unidades e pessoas, a cobrança mensal, a conciliação bancária e o financeiro de cada condomínio. O cadastro é feito uma vez e serve de base para todo o resto.",
    },
    {
      title: "Como é o cadastro?",
      text: "Condomínios, blocos, unidades e pessoas num cadastro único, com busca instantânea.",
    },
    {
      title: "Como funciona a cobrança?",
      text: "A administradora define o plano de cada condomínio uma vez: taxas, rateio por fração ideal, vencimento, desconto, multa e juros. Todo mês o sistema emite os documentos de todas as unidades em lote e registra os boletos, sem planilhas.",
    },
    {
      title: "E a conciliação?",
      text: "O banco avisa o pagamento e a baixa entra sozinha, conciliada com o extrato.",
    },
    {
      title: "E as despesas?",
      text: "Contas a pagar por centro de custo, com vencimento e baixa no mesmo lugar.",
    },
    {
      title: "O que fica registrado?",
      text: "Nenhum lançamento do financeiro é editado ou apagado: só estornado, com justificativa. O boleto, o valor baixado e o lançamento do mês se referem sempre ao mesmo registro, e o histórico fica completo.",
    },
    {
      title: "E vários condomínios?",
      text: "Condomínios de cidades e estados diferentes no mesmo painel, com contas a pagar e pendências de todos juntos.",
    },
  ],
};

/**
 * Duas telas reais do sistema (`ScreenStack`), uma por vez: ao lado, a frase de abertura e os três pontos da tela da vez.
 * Os prints (`public/marketing/painel.png` e `unidades.png`, 1440×900 a 2x) usam só dados fictícios (`seed_demo`); se forem
 * refeitos, manter o tema claro e o mesmo tamanho. Só afirma o que a tela mostra: conferir o texto contra o print.
 */
export const SCREENS = [
  {
    key: "painel",
    alt: "Painel do sistema: resumo da carteira, contas a pagar e pendências",
    title: "Painel",
    lead: "A primeira tela do dia mostra o que pede atenção na administração: quantos condomínios, unidades e pessoas há na carteira, o que vence e o que está pendente, sem abrir relatório nenhum.",
    points: [
      { term: "Contas a pagar", text: "Atrasadas, de hoje, dos próximos 7 dias e do mês, de todos os condomínios, com as mais antigas em aberto logo abaixo." },
      { term: "Pendências", text: "Unidades sem responsável, rateio que não fecha 100%, reajustes atrasados, locações terminando e condomínios sem centro de custo." },
      { term: "Receita fixa", text: "A soma mensal das taxas fixas de administração, com a parte de cada condomínio." },
    ],
  },
  {
    key: "unidades",
    alt: "Lista de unidades de todos os condomínios, com bloco, tipo e proprietários ou locatários",
    title: "Unidades",
    lead: "Todas as unidades dos condomínios administrados numa lista só, cada uma ligada às pessoas que respondem por ela. É a base de onde parte a cobrança.",
    points: [
      { term: "Quem responde", text: "Proprietários e locatários de cada unidade, com o ID do cadastro de pessoas, para achar a pessoa certa na hora." },
      { term: "Como é a unidade", text: "Condomínio, bloco e tipo (loja, conjunto, sala), com as inativas identificadas na própria linha." },
      { term: "Filtros", text: "Para achar qualquer unidade entre as de todos os condomínios, e a lista paginada quando a carteira cresce." },
    ],
  },
] as const;

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

