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
 * As telas reais mostradas em `ScreenStack` (prints 1440×900 a 2x em `public/marketing`, tema claro, só dados fictícios de
 * `seed_demo`; se refeitos, manter o tema e o tamanho). Cada ponto aproxima a imagem de uma região do print: `x` e `y` são o centro,
 * em % da imagem, e `zoom` o aumento. O texto descreve só o que o print mostra.
 */
export const SCREENS = [
  {
    key: "painel",
    alt: "Painel do sistema: emissão do mês, inadimplência, contas a pagar e pendências",
    title: "Painel",
    lead: "O que pede atenção hoje: o que foi cobrado, o que está atrasado e o que ainda falta cadastrar.",
    points: [
      { term: "Emissão do mês", text: "O valor emitido, quanto já foi recebido e o que segue em aberto. Quando uma emissão dá problema, a linha vermelha avisa.", focus: { x: 22, y: 30, zoom: 2.8 } },
      { term: "Inadimplência", text: "Os boletos vencidos e não pagos, com os condomínios que mais devem logo abaixo.", focus: { x: 52.5, y: 30, zoom: 2.8 } },
      { term: "Contas a pagar", text: "As contas vencidas, as de hoje, as dos próximos 7 dias e as do mês.", focus: { x: 83, y: 30, zoom: 2.8 } },
      { term: "Pendências", text: "Unidades sem responsável, rateio que não fecha 100% e lançamentos bloqueados, cada um com a sua quantidade.", focus: { x: 83, y: 66, zoom: 2.1 } },
    ],
  },
  {
    key: "unidades",
    alt: "Unidade aberta: lista de unidades do condomínio, dados da unidade e frações ideais",
    title: "Unidades",
    lead: "Cada unidade com as pessoas que respondem por ela. É dela que parte a cobrança.",
    points: [
      { term: "A lista", text: "As unidades do condomínio escolhido, com bloco e responsável. As inativas aparecem marcadas na própria linha.", focus: { x: 18, y: 42, zoom: 1.9 } },
      { term: "Dados da unidade", text: "Número, bloco, tipo, matrícula e quantidade de moradores, e a marca de unidade do síndico.", focus: { x: 57, y: 30, zoom: 1.9 } },
      { term: "Frações ideais", text: "A parte da unidade no rateio de cada critério. Um critério novo se cria ali mesmo.", focus: { x: 57, y: 62, zoom: 1.9 } },
    ],
  },
  {
    key: "extrato",
    alt: "Extrato de um condomínio: saldo, saldo por sub-conta e lançamentos",
    title: "Extrato",
    lead: "A conta corrente de cada condomínio, do saldo ao último lançamento.",
    points: [
      { term: "Saldo de cada condomínio", text: "A lista mostra o saldo ao lado do nome, em vermelho quando é negativo.", focus: { x: 18, y: 42, zoom: 1.9 } },
      { term: "Saldo por sub-conta", text: "O mesmo saldo repartido por sub-conta. A soma delas é o saldo total.", focus: { x: 47, y: 36, zoom: 1.9 } },
      { term: "Lançamentos", text: "Do mais novo ao mais antigo, com a sub-conta e o número de cada um, busca pela descrição e filtro por mês.", focus: { x: 56, y: 76, zoom: 1.9 } },
    ],
  },
  {
    key: "inadimplencia",
    alt: "Relatório de inadimplência: total vencido, condomínios que mais devem e lista de boletos",
    title: "Inadimplência",
    lead: "Todos os boletos vencidos e não pagos, por condomínio. O valor é o do boleto, sem multa nem juros.",
    points: [
      { term: "Total vencido", text: "A soma de tudo o que está em atraso, em destaque, com o relatório em PDF a um clique.", focus: { x: 52, y: 34, zoom: 2 } },
      { term: "Quem mais deve", text: "Os condomínios com mais boletos vencidos, em porcentagem do total.", focus: { x: 80, y: 34, zoom: 2.5 } },
      { term: "Boleto a boleto", text: "Unidade, pagador, referência, vencimento com os dias de atraso e valor, dez por página.", focus: { x: 66, y: 74, zoom: 1.6 } },
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

