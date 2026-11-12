/** Os textos do assistente de ajuda (spec 069 do backend). O aviso de dados sensíveis é parte do contrato: o filtro do backend recusa o que sobrar. */
export const ASSISTANT_COPY = {
  title: "Assistente de ajuda",
  trigger: "Ajuda",
  open: "Abrir o assistente de ajuda",
  close: "Fechar o assistente",
  notice:
    "Não digite CPF, CNPJ, e-mail, telefone, boleto ou nomes de moradores. O assistente não vê os seus cadastros e pode errar.",
  placeholder: "Escreva a sua dúvida",
  send: "Enviar",
  thinking: "Pensando…",
  failed: "Não foi possível obter a resposta. Tente novamente em instantes.",
  subtitle: "Tire dúvidas sobre o sistema",
  welcome: "Como posso ajudar?",
  welcomeHint: "Pergunte sobre conceitos e sobre como usar o sistema.",
  suggestions: ["O que é a fração ideal?", "Como funciona o reajuste anual?", "O que é a taxa de administração fixa?"],
} as const;

export const ASSISTANT_QUESTION_MAX_LENGTH = 500;
