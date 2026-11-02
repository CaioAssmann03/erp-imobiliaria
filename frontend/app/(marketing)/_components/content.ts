import type { ModuleSlug } from "@/lib/site/public-pages";

export interface Feature {
  title: string;
  description: string;
}

export interface HowItWorksFloor {
  label: string;
  text: string;
}

/** Destino dos botões "Agendar demonstração": a página de contato (e-mail e WhatsApp, `lib/site/site.ts`). */
export const CONTACT_HREF = "/contato";

export const NAV_LINKS = [
  { href: "/features", label: "Recursos" },
  { href: "/how-it-works", label: "Como funciona" },
  { href: CONTACT_HREF, label: "Contato" },
] as const;

/**
 * Resumo logo abaixo do hero (`Summary`): um texto formal e justificado sobre o que é o sistema, um parágrafo de
 * abertura e os demais em duas colunas. Só afirma o que o sistema faz (ver `FEATURES` e `HOW_IT_WORKS`), sem números inventados.
 */
export const SUMMARY = {
  lead: "O METRI é um sistema de gestão desenvolvido para administradoras de condomínios. Reúne, em uma única plataforma, o cadastro de condomínios, blocos, unidades e pessoas, a cobrança mensal, a conciliação bancária e o financeiro de cada condomínio administrado.",
  paragraphs: [
    "O cadastro é mantido uma única vez e serve de base para todas as demais rotinas. A partir dele, a administradora define os planos de cobrança de cada condomínio, emite os documentos do mês em lote para todas as unidades e registra os boletos correspondentes, sem a necessidade de planilhas intermediárias.",
    "Os pagamentos são recebidos do banco por meio de baixa automática e conciliados com o extrato, de modo que o boleto emitido, o valor baixado e o lançamento do mês refiram-se sempre ao mesmo registro. As despesas são lançadas por centro de custo, com contas a pagar, baixa e histórico completo.",
    "O resultado é uma operação rastreável, com menos conferência manual e informação consistente entre as áreas, o que permite à equipe dedicar mais tempo ao atendimento de quem mora e trabalha nos condomínios.",
  ],
};

/**
 * As partes do sistema, uma seção de Recursos cada (`ModuleSection`): um parágrafo de abertura e os demais, justificados
 * como no `SUMMARY`. Só afirma o que o sistema faz hoje (ver `docs/requirements/product-scope.md`), sem números inventados.
 */
export const MODULES = {
  condominiums: {
    slug: "condominios",
    title: "Condomínios",
    summary: "Condomínio, blocos, unidades e pessoas, cadastrados uma vez.",
    paragraphs: [
      "O cadastro começa pelo condomínio: identificação, endereço, contrato e regras de cobrança, como vencimento, multa, juros e desconto. Definido uma vez, vale para todas as unidades e para todos os meses.",
      "Dentro dele ficam os blocos e as unidades, cada uma com o seu tipo e a sua fração ideal em cada critério de rateio.",
      "Proprietários e inquilinos são ligados às unidades. Cada pessoa, física (CPF) ou jurídica (CNPJ), é cadastrada uma só vez, mesmo em vários condomínios.",
    ],
  },
  entries: {
    slug: "lancamentos",
    title: "Lançamentos",
    summary: "Valores que entram no boleto além do plano de cobrança.",
    paragraphs: [
      "Um lançamento é um valor que entra no boleto além do plano de cobrança: uma despesa pontual, uma parcela de obra. Ele fica ligado a um condomínio, a um evento e a uma sub-conta e aparece na linha do boleto de cada unidade.",
      "O valor pode ser dado por unidade, dividido igualmente ou dividido pela fração ideal de cada uma, e a tela calcula o de cada unidade antes de salvar.",
      "Cada lançamento vale uma vez, em parcelas ou todo mês, até ser encerrado. O mês aparece numa grade por unidade, com o total à vista.",
      "Quando o valor é dado por unidade, cada uma pode ter o seu, e as que ficam de fora não pagam nada. Quando é dividido pela fração ideal, o lançamento usa um dos critérios de rateio do condomínio, e só entram as unidades que têm fração nesse critério.",
      "Na parcela, o boleto mostra em que ponto está, como 3 de 6. O lançamento que não acaba nunca pode ser encerrado quando deixar de valer, e o que já saiu em algum boleto não se edita, só se encerra, para o que foi cobrado continuar igual ao que foi emitido.",
      "O evento dá o nome à linha do boleto, com o código à frente, e a sub-conta diz onde o valor entra na contabilidade do condomínio. Quando o evento é da própria administradora, como uma tarifa, o lançamento não tem sub-conta, porque o valor não é do condomínio.",
    ],
  },
  billing: {
    slug: "cobrancas",
    title: "Cobranças",
    summary: "Do plano de cobrança ao boleto pago.",
    paragraphs: [
      "Cada condomínio tem o seu plano de cobrança: um valor fixo por unidade, um total dividido pela fração ideal ou o valor cadastrado na unidade, como gás, água e luz. Os lançamentos do mês entram junto.",
      "Emitir o mês gera um documento para cada unidade, em nome de quem recebe a cobrança, proprietário ou inquilino, com desconto, multa e juros copiados das regras do condomínio. Quando uma unidade não pode ser cobrada, a emissão diz o motivo e leva ao cadastro para corrigir.",
      "O boleto é registrado com Pix, enviado por e-mail e acompanhado até o pagamento. O que passa do vencimento aparece como atraso, e um documento pode ser reemitido com nova data ou cancelado.",
    ],
  },
} as const;

/** Os módulos com página própria, na ordem de Recursos: o submenu do cabeçalho os lista. */
export const MODULE_LINKS = Object.values(MODULES).map((module) => ({
  href: `/features/${module.slug}`,
  label: module.title,
  summary: module.summary,
}));

/** Um módulo de Recursos visto de perto (`/features/[slug]`): a abertura e as seções, cada uma com o seu título. */
export interface ModulePage {
  title: string;
  /** A abertura da página e a descrição para os buscadores. */
  lead: string;
  sections: readonly { title: string; paragraphs: readonly string[]; /** Uma legenda curta, que algumas páginas mostram ao lado do título. */ tag?: string }[];
}

/**
 * O conteúdo das páginas "Saber mais", uma por módulo. Só afirma o que o sistema faz hoje (ver
 * `docs/requirements/product-scope.md` e `docs/entities/domain-model.md`), sem números inventados.
 */
export const MODULE_PAGES: Record<ModuleSlug, ModulePage> = {
  condominios: {
    title: "Condomínios",
    lead: "O cadastro que sustenta todas as demais rotinas do sistema: condomínio, blocos, unidades e pessoas, definidos uma vez e usados em todos os meses.",
    sections: [
      {
        title: "O condomínio",
        paragraphs: [
          "Tudo começa pelo condomínio. Cada um é identificado pelo nome, pelo CNPJ e pelo tipo, residencial ou comercial, e recebe do sistema um código próprio, que é o número que a equipe digita para encontrá-lo. O cadastro guarda ainda o endereço completo, com busca pelo CEP, a inscrição municipal e os medidores de água e de energia, e pode apontar um conselheiro, que é uma pessoa já cadastrada.",
          "A administradora trabalha com a lista de condomínios de um lado e, do outro, a página do condomínio aberto, com todas as suas seções e um índice lateral para ir direto a cada uma. Como tudo o que se faz depois, da cobrança ao financeiro, parte desse registro, ele é mantido uma única vez.",
        ],
      },
      {
        title: "Contrato de administração",
        paragraphs: [
          "O contrato registra a taxa de administração, que pode ser fixa, com um valor, ou variável, com uma porcentagem sobre a receita ou sobre a despesa do condomínio. Registra também se o ISS é cobrado sobre a taxa, a data de início e o reajuste: data-base, periodicidade em meses e índice.",
          "Os reajustes que se aproximam aparecem no painel da administradora, para que nenhum seja esquecido, e o painel soma a receita fixa de todos os contratos e diz quantos condomínios de taxa variável ficaram de fora dessa soma.",
        ],
      },
      {
        title: "Regras de cobrança",
        paragraphs: [
          "As regras de cobrança são definidas uma vez para o condomínio e valem para todas as unidades e todos os meses. Entre elas estão o dia do vencimento, de 1 a 28, e se ele cai em dia útil; o mês do vencimento, o de referência ou o seguinte; e a competência, igual ao mês do vencimento ou anterior a ele. A tela mostra uma frase de exemplo, para que se veja o efeito antes de salvar.",
          "Há o desconto por pagamento antecipado, com a porcentagem e o número de dias; a multa por atraso, limitada a 2% como manda o Código Civil, com uma faixa inicial opcional para os primeiros dias; e os juros, calculados pelo mês cheio ou por dia, com dias de carência. Por fim, o dia do mês em que a emissão roda, a isenção da unidade do síndico e as opções de mostrar o QR Code e o demonstrativo da taxa no boleto.",
          "Como as regras são copiadas para cada documento no momento da emissão, mudar uma delas vale para os meses seguintes e não altera o que já foi emitido.",
        ],
      },
      {
        title: "Blocos e unidades",
        paragraphs: [
          "Dentro do condomínio ficam os blocos, que são opcionais, e as unidades. Cada unidade tem nome, tipo (apartamento, sala, loja, casa, suíte, vaga ou outro), número de moradores e matrícula, e pode guardar os valores cadastrados de gás, água e energia, usados quando o plano de cobrança cobra o consumo.",
          "A unidade diz quem recebe o boleto, o proprietário ou o inquilino, se é a unidade do síndico e se a cobrança está bloqueada. Em cada critério de rateio do condomínio, ela tem a sua fração ideal.",
          "Todo condomínio tem ao menos um critério de rateio, o principal, e pode criar outros. A soma das frações das unidades ativas não pode passar de 100% em nenhum deles, e a página do condomínio mostra o total de cada critério e avisa quando algum não fecha, antes que isso atrapalhe uma cobrança dividida pela fração ideal.",
        ],
      },
      {
        title: "Pessoas",
        paragraphs: [
          "Cada pessoa, física, com CPF, ou jurídica, com CNPJ, é cadastrada uma única vez, mesmo que seja dona de unidades em vários condomínios. Ela tem um código, nome, e-mail e telefones; a pessoa física guarda ainda RG, data de nascimento, estado civil e profissão, e a jurídica, a inscrição estadual. O tipo de documento não muda depois do cadastro.",
          "Proprietários e inquilinos são ligados às unidades, e é essa ligação que define quem recebe a cobrança. O vínculo registra o papel, o percentual de propriedade, no caso do proprietário, e as datas de início e de fim, de modo que uma locação que termina não passa despercebida.",
          "O painel reúne as pendências do cadastro, como condomínios sem sub-contas, unidades com a cobrança bloqueada e locações que terminam, cada uma com um atalho para a lista já filtrada.",
        ],
      },
      {
        title: "Eventos e sub-contas",
        paragraphs: [
          "As sub-contas são os centros de custo do condomínio, onde cada valor cobrado ou pago é classificado. A administradora mantém um catálogo delas, com código e nome, uma vez para todos os condomínios, e cada condomínio ativa as que usa.",
          "Os eventos, formados por um código e um nome, dão o nome às linhas do boleto e são reaproveitados nos lançamentos e nos planos de cobrança.",
          "Com o cadastro pronto, a cobrança do mês, os lançamentos e o financeiro encontram tudo no lugar.",
        ],
      },
    ],
  },
  lancamentos: {
    title: "Lançamentos",
    lead: "Os valores que entram no boleto além do plano de cobrança: uma despesa pontual, uma parcela de obra, uma taxa extra.",
    sections: [
      {
        title: "O que é um lançamento",
        tag: "uma linha no boleto",
        paragraphs: [
          "O plano de cobrança cuida do que se repete todo mês. Um lançamento é o que fica de fora dele: um valor com início e fim próprios, ligado a um condomínio, a um evento e a uma sub-conta, que aparece como uma linha no boleto de cada unidade.",
          "A tela de Inclusão de valores mostra os lançamentos de um mês, escolhido por condomínio, e a grade do mês por unidade, com o total à vista. É nela que se cria um lançamento novo, e é nela que se encerra ou se exclui um que já existe.",
          "Servem para tudo o que não tem lugar fixo no plano: uma despesa pontual, uma parcela de obra, uma taxa extra, um reforço de fundo. O plano continua o mesmo e o lançamento entra por cima dele, no mês escolhido, para todas as unidades do condomínio ou só para algumas.",
        ],
      },
      {
        title: "Como o valor é dado",
        tag: "individual · coletivo · fração ideal",
        paragraphs: [
          "No modo individual, cada unidade escolhida paga o valor informado ou o seu próprio valor, quando tem um, e as que ficam de fora não pagam nada. No modo coletivo, o total é dividido igualmente entre as unidades escolhidas.",
          "No modo pela fração ideal, o total é dividido segundo um dos critérios de rateio do condomínio. Só entram as unidades que têm fração nesse critério, e cada uma paga a sua parte do total, proporcional à fração que tem.",
          "Antes de salvar, a tela calcula e mostra o valor de cada unidade, para que o lançamento seja conferido enquanto se preenche, sem surpresa depois da emissão.",
          "Em qualquer dos três modos, o que a tela mostra é o que o boleto vai trazer: o valor de cada unidade e o total do lançamento, conferidos antes de salvar e iguais aos da grade do mês depois dele.",
        ],
      },
      {
        title: "Uma vez, em parcelas ou todo mês",
        tag: "recorrência",
        paragraphs: [
          "Um lançamento pode valer uma única vez, em um mês; ser dividido em parcelas, em um número de duas ou mais; ou se repetir todo mês, até ser encerrado. O mês de início é sempre o primeiro dia de um mês, e o lançamento que não acaba pode ter um mês final definido.",
          "Na parcela, o boleto mostra em que ponto está, como 3 de 6, de modo que quem paga sabe quantas faltam. O mês escolhido na tela mostra só os lançamentos que caem nele, cada um com a sua parcela e o valor de cada unidade.",
          "Quem acompanha uma obra em parcelas vê, a cada mês, a parcela da vez e quantas faltam. O lançamento que se repete sem fim fica na grade de todos os meses seguintes até ser encerrado, e encerrar tira só os meses que ainda virão: o que já passou continua como foi cobrado.",
        ],
      },
      {
        title: "Eventos, sub-contas e a administradora",
        tag: "o nome da linha",
        paragraphs: [
          "O evento dá o nome à linha do boleto, que abre com o código dele, e a sub-conta diz onde o valor entra na contabilidade do condomínio. Quando o evento é da própria administradora, como uma tarifa, o lançamento não tem sub-conta, porque o valor não é do condomínio.",
          "O modelo do lançamento contábil não se escolhe na tela: é o único ativo da sub-conta, e o sistema o usa sozinho quando o valor é cobrado. Por isso uma sub-conta só pode receber lançamentos quando tem exatamente um modelo ativo.",
        ],
      },
      {
        title: "Depois de emitido",
        tag: "só se encerra",
        paragraphs: [
          "Um lançamento ainda não usado pode ser editado ou excluído. Assim que algum boleto sai com ele, só resta encerrá-lo, para que o que foi cobrado continue igual ao que foi emitido e os meses seguintes deixem de trazer a linha.",
          "É por isso que a tela lembra, no alto de cada lançamento, que ele não se altera: para mudar um valor, exclui-se o lançamento e inclui-se outro, e, se algum boleto já saiu com ele, encerra-se o antigo e inclui-se o novo a partir do mês seguinte.",
        ],
      },
    ],
  },
  cobrancas: {
    title: "Cobranças",
    lead: "Do plano de cobrança ao boleto pago: planos, emissão do mês, documentos registrados com Pix e o acompanhamento até o pagamento.",
    sections: [
      {
        title: "Planos de cobrança",
        paragraphs: [
          "Cada condomínio tem um ou mais planos de cobrança, com nome e, se for o caso, mês de início e de fim. O plano é uma lista de itens, escritos na ordem em que aparecem no boleto, e cada item abre com o código e o nome do seu evento.",
          "Um item pode ser um valor fixo por unidade; um total dividido pela fração ideal, segundo um critério de rateio; ou o valor cadastrado na unidade, de gás, água ou energia. Cada item é ligado a uma sub-conta, que diz onde o valor entra na contabilidade.",
          "A emissão usa o plano que está em vigor no mês. Um condomínio sem plano em vigor não é emitido, e a execução avisa, para que o plano seja criado ou corrigido antes de o mês passar.",
        ],
      },
      {
        title: "Emitir o mês",
        paragraphs: [
          "A emissão é feita por condomínio e por mês, no dia configurado nas regras de cobrança ou na hora, pelo botão Emitir mês. Cada execução fica registrada, com a situação (em andamento, concluída, parcial ou com falha) e as contagens do que foi emitido.",
          "Quando uma unidade não pode ser cobrada, a execução não esconde o motivo: cada problema vem com uma frase em português e um atalho para o cadastro onde se corrige, como a falta de plano em vigor, de regras de cobrança ou de um responsável atual, uma cobrança bloqueada, ou um pagador sem CPF ou CNPJ.",
          "No painel, a emissão do mês aparece como um cartão: quanto foi emitido, quanto já foi recebido e quantos condomínios ativos já têm boleto no mês, com a lista dos que ainda não têm e das execuções com problema.",
        ],
      },
      {
        title: "O documento de cada unidade",
        paragraphs: [
          "A emissão gera um documento por unidade e por mês, em nome de quem recebe a cobrança, com mês de referência, competência, vencimento, itens e valor. O desconto, a multa e os juros são copiados das regras do condomínio no momento da emissão, de modo que uma mudança posterior nas regras não altera o que já foi emitido.",
          "Um documento pode ser cancelado, reemitido com uma nova data de vencimento ou baixado em PDF.",
        ],
      },
      {
        title: "Boleto, Pix e envio",
        paragraphs: [
          "O boleto é registrado no banco, e o documento passa a guardar o nosso número, a linha digitável, o código de barras e o link do boleto, além do código do Pix e a data em que ele expira.",
          "O envio é feito por e-mail, e o documento mostra o estado dele: pendente, enviado, entregue ou com falha, e, nesse caso, o motivo.",
        ],
      },
      {
        title: "Pagamento e atraso",
        paragraphs: [
          "Um documento passa por emitido, registrado e pago, ou é cancelado, e é marcado como vencido quando passa da data sem pagamento. Quando o pagamento entra, o documento guarda a data, o valor pago e o valor líquido.",
          "No painel, a emissão do mês e a inadimplência aparecem como cartões, com os condomínios que ainda não têm boleto e os que mais devem. O relatório de Inadimplência lista os boletos vencidos por condomínio, com totais e PDF.",
          "Os pagamentos chegam do banco por baixa automática e são conciliados com o extrato, de modo que o boleto emitido, o valor baixado e o lançamento do mês se referem sempre ao mesmo registro.",
        ],
      },
    ],
  },
};

/**
 * A sigla METRI (README: Modelo Eficiente de Tempo e Recursos Imobiliários), uma linha por letra para `AcronymReveal`.
 * `letter` é a inicial da palavra e `rest` o que falta dela; `then` é a ligação ("de", "e") que a frase tem depois da palavra.
 */
export const ACRONYM = [
  { letter: "M", rest: "odelo" },
  { letter: "E", rest: "ficiente", then: "de" },
  { letter: "T", rest: "empo", then: "e" },
  { letter: "R", rest: "ecursos" },
  { letter: "I", rest: "mobiliários" },
] as const;

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
    key: "unidades",
    alt: "Unidade aberta: lista de unidades do condomínio, dados da unidade e frações ideais",
    title: "Condomínios",
    lead: "Cada unidade com as pessoas que respondem por ela. É dela que parte a cobrança.",
    points: [
      { term: "A lista", text: "As unidades do condomínio escolhido, cada uma com o bloco e o responsável.", focus: { x: 18, y: 44, zoom: 1.9 } },
      { term: "Identificação", text: "O número, o tipo, o bloco, a matrícula do imóvel, o número de moradores e a marca de unidade do síndico.", focus: { x: 57, y: 33, zoom: 1.9 } },
      { term: "Frações ideais", text: "A parte da unidade no rateio de cada critério. Um critério novo se cria ali mesmo.", focus: { x: 57, y: 63.5, zoom: 1.9 } },
    ],
  },
  {
    key: "lancamentos",
    alt: "Inclusão de valores: os lançamentos do mês numa lista e, ao lado, a grade com o valor de cada unidade e o total",
    title: "Lançamentos",
    lead: "O que entra no boleto além do plano de cobrança, mês a mês, e quanto cada unidade paga.",
    points: [
      { term: "A lista do mês", text: "Os lançamentos do mês escolhido, cada um com o evento, a sub-conta, a parcela (3/6) ou o \"sempre\" e o valor.", focus: { x: 18, y: 32, zoom: 2 } },
      { term: "A grade por unidade", text: "Uma coluna por lançamento, com o total dele, e uma linha por unidade, com o que ela paga em cada um.", focus: { x: 65, y: 34, zoom: 1.5 } },
      { term: "O total do mês", text: "A soma de cada lançamento no pé da grade e, no canto, o total geral.", focus: { x: 65, y: 51, zoom: 1.6 } },
    ],
  },
  {
    key: "cobrancas",
    alt: "Documento de cobrança aberto: valor, vencimento e situação, o boleto e os itens, ao lado da lista de documentos",
    title: "Cobranças",
    lead: "O documento de cada unidade, do valor ao pagador, e o que o compõe.",
    points: [
      { term: "Os documentos", text: "Os documentos do condomínio, por unidade e mês, com o pagador, o valor e a situação: emitido ou vencido.", focus: { x: 18, y: 41, zoom: 1.7 } },
      { term: "O resumo", text: "O valor, o vencimento e a situação, o condomínio, a unidade e o pagador, com o PDF e o cancelamento a um clique.", focus: { x: 57, y: 26, zoom: 1.9 } },
      { term: "Os itens", text: "O que compõe o valor, item a item, cada um com a sua sub-conta.", focus: { x: 57, y: 70, zoom: 1.9 } },
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

/**
 * A abertura de Como funciona: uma frase de destaque e os parágrafos que contam o caminho inteiro, justificados ao lado dela.
 * Só afirma o que o sistema faz hoje (os mesmos fatos de `HOW_IT_WORKS` e `MODULES`), sem números inventados.
 */
export const HOW_IT_WORKS_INTRO = {
  lead: "Cada etapa parte da anterior: o que se cadastra uma vez serve para todo o resto.",
  paragraphs: [
    "O METRI segue a ordem em que a administradora trabalha. Primeiro vem o cadastro: o condomínio, os blocos, as unidades e as pessoas entram uma única vez, junto com as regras de cobrança, como o dia do vencimento, a multa, os juros e o desconto. Tudo o que vem depois parte desse registro, e por isso ele não precisa ser repetido a cada mês.",
    "Em seguida, cada condomínio recebe um plano de cobrança: a lista de itens, na ordem em que aparecem no boleto, com um valor fixo por unidade, um total dividido pela fração ideal ou o consumo cadastrado na unidade. O que fica fora do plano, como uma despesa pontual ou uma parcela de obra, entra como lançamento, uma vez, em parcelas ou todo mês.",
    "No dia configurado, ou na hora pelo botão Emitir mês, o sistema gera um documento por unidade e registra o boleto no banco, com o Pix. Cada execução fica registrada e, quando algo impede a cobrança, o motivo vem com um atalho para corrigir.",
    "Por fim, o banco avisa o pagamento e a baixa entra sozinha, conciliada com o extrato. O boleto emitido, o valor baixado e o lançamento do mês se referem sempre ao mesmo registro, e o que passa do vencimento sem pagamento fica como vencido. A equipe acompanha tudo sem planilhas no meio.",
  ],
};

/**
 * A página Como funciona (`HowItWorks`): uma fila de prédios, um por etapa, do cadastro ao pagamento conciliado. A ordem é a
 * do trabalho; cada prédio mostra o nome e o texto da etapa. Só afirma o que o sistema faz hoje (os mesmos fatos de
 * `MODULE_PAGES`).
 */
export const HOW_IT_WORKS: readonly HowItWorksFloor[] = [
  {
    label: "Cadastro do condomínio",
    text: "Cada unidade tem um tipo: apartamento, sala, loja, casa, suíte ou vaga de garagem. Excluir um condomínio, bloco, unidade ou pessoa arquiva o registro: ele sai das listas, das buscas e dos relatórios, mas continua guardado, e o sistema recusa arquivar um condomínio ativo ou uma unidade que ainda tem proprietário. A anonimização prevista na LGPD fica com o administrador do sistema.",
  },
  {
    label: "Plano de cobrança",
    text: "No rateio pela fração ideal, o valor de cada unidade é arredondado para o centavo e os centavos que sobram vão para a unidade de maior fração, de modo que a soma fecha exatamente no total do plano. O vencimento pode ser fixado em dia útil.",
  },
  {
    label: "Lançamentos e estorno",
    text: "Para o que não passa pelo boleto, o financeiro faz o lançamento manual em lote: vários lançamentos, até de condomínios diferentes, são gravados todos ou nenhum. Um lote aberto mostra os seus lançamentos e permite estornar todos eles de uma vez.",
  },
  {
    label: "Emissão mensal de boletos",
    text: "A emissão roda sozinha todos os dias, de manhã, e atende os condomínios cujo dia de emissão chegou, do dia 1 ao 28, definido em cada um. Cada documento mostra o resumo e os itens, tem um PDF de rascunho para baixar e pode ser cancelado; as execuções aparecem por condomínio e mês, com a contagem de documentos.",
  },
  {
    label: "Baixa e conciliação bancária",
    text: "O extrato do condomínio mostra o saldo geral e por centro de custo, com filtro por período e mês de referência. Dois relatórios saem em PDF: Inadimplência, com os boletos vencidos por condomínio e os totais, e Prestação de contas, com o mês do condomínio por sub-conta. As tarifas de registro dos boletos pagos vão para a conta da própria administradora.",
  },
];

