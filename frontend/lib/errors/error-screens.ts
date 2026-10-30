import { isAxiosError } from "axios";

/** Telas de erro por código HTTP: texto em português e a saída que cada uma oferece. */

export type ErrorAction = "retry" | "home" | "login" | "back";

export type ErrorScreenInfo = {
  code: number;
  title: string;
  message: string;
  /** O que a pessoa pode fazer, em uma linha curta (opcional). */
  hint?: string;
  /** A primeira é a ação principal (botão escuro); as outras são secundárias. */
  actions: ErrorAction[];
  /** Segundos de espera antes de liberar "Tentar de novo" (limite de pedidos, manutenção). */
  retryAfter?: number;
};

export const ERROR_SCREENS: ErrorScreenInfo[] = [
  {
    code: 400,
    title: "Requisição inválida",
    message: "Não foi possível entender o pedido enviado.",
    hint: "Volte, confira os dados preenchidos e tente de novo.",
    actions: ["back", "home"],
  },
  {
    code: 401,
    title: "Sessão expirada",
    message: "Por segurança, a sua sessão terminou.",
    hint: "Entre novamente para continuar de onde parou.",
    actions: ["login"],
  },
  {
    code: 402,
    title: "Assinatura pendente",
    message: "O plano da sua empresa está com pagamento pendente.",
    hint: "Fale com o responsável pela conta para regularizar.",
    actions: ["home", "back"],
  },
  {
    code: 403,
    title: "Acesso negado",
    message: "Você não tem permissão para ver esta página.",
    hint: "Peça acesso ao administrador da sua empresa ou entre com outra conta.",
    actions: ["home", "login"],
  },
  {
    code: 404,
    title: "Página não encontrada",
    message: "O endereço não existe ou o registro foi removido.",
    hint: "Confira o endereço ou volte ao painel.",
    actions: ["home", "back"],
  },
  {
    code: 405,
    title: "Ação não permitida",
    message: "Esta página não aceita essa operação.",
    hint: "Volte e use as opções da própria tela.",
    actions: ["back", "home"],
  },
  {
    code: 408,
    title: "Tempo esgotado",
    message: "A resposta demorou mais do que o esperado.",
    hint: "Verifique a sua conexão e tente de novo.",
    actions: ["retry", "home"],
  },
  {
    code: 409,
    title: "Conflito de dados",
    message: "Este registro foi alterado por outra pessoa enquanto você o editava.",
    hint: "Recarregue a página para ver a versão mais recente.",
    actions: ["retry", "home"],
  },
  {
    code: 410,
    title: "Registro removido",
    message: "Este registro foi arquivado ou excluído e não está mais disponível.",
    hint: "Registros arquivados podem ser consultados pelo administrador.",
    actions: ["home", "back"],
  },
  {
    code: 413,
    title: "Arquivo grande demais",
    message: "O arquivo enviado passa do tamanho permitido.",
    hint: "Reduza o arquivo ou envie uma versão menor.",
    actions: ["back", "home"],
  },
  {
    code: 415,
    title: "Formato não aceito",
    message: "O tipo de arquivo enviado não é aceito aqui.",
    hint: "Envie o arquivo em PDF ou imagem.",
    actions: ["back", "home"],
  },
  {
    code: 422,
    title: "Dados não processados",
    message: "Alguns dados enviados não puderam ser processados.",
    hint: "Revise os campos marcados e envie de novo.",
    actions: ["back", "home"],
  },
  {
    code: 423,
    title: "Registro bloqueado",
    message: "Este registro está bloqueado para alterações, por exemplo em um período já fechado.",
    hint: "Fale com o administrador para liberar a edição.",
    actions: ["back", "home"],
  },
  {
    code: 429,
    title: "Muitas tentativas",
    message: "Você fez pedidos demais em pouco tempo.",
    hint: "Aguarde um instante; o botão libera sozinho.",
    actions: ["retry", "home"],
    retryAfter: 30,
  },
  {
    code: 500,
    title: "Algo deu errado",
    message: "Não foi possível carregar esta página.",
    hint: "Tente de novo; se continuar, volte ao painel e avise o suporte.",
    actions: ["retry", "home"],
  },
  {
    code: 501,
    title: "Recurso indisponível",
    message: "Esta função ainda não está disponível no sistema.",
    hint: "Ela chega em uma próxima atualização.",
    actions: ["home", "back"],
  },
  {
    code: 502,
    title: "Servidor indisponível",
    message: "O servidor não respondeu como esperado.",
    hint: "Tente de novo em alguns instantes.",
    actions: ["retry", "home"],
  },
  {
    code: 503,
    title: "Em manutenção",
    message: "O sistema está fora do ar por um momento.",
    hint: "Voltamos em breve; o botão libera sozinho.",
    actions: ["retry"],
    retryAfter: 20,
  },
  {
    code: 504,
    title: "Servidor sem resposta",
    message: "O servidor demorou demais para responder.",
    hint: "Tente de novo em alguns instantes.",
    actions: ["retry", "home"],
  },
];

/** Qualquer código de erro HTTP (400 a 599): o da lista, ou um texto genérico da faixa. */
export function resolveErrorScreen(code: number): ErrorScreenInfo | undefined {
  const known = ERROR_SCREENS.find((screen) => screen.code === code);
  if (known) return known;
  if (code >= 500 && code <= 599)
    return { code, title: "Erro no servidor", message: "Algo falhou do nosso lado.", hint: "Tente de novo em alguns instantes.", actions: ["retry", "home"] };
  if (code >= 400 && code <= 499)
    return { code, title: "Não foi possível concluir", message: "O pedido não pôde ser atendido.", hint: "Volte e tente de novo.", actions: ["back", "home"] };
  return undefined;
}

/** O código da tela de erro para o que chegou ao `error.tsx`: o status da resposta, 408 se o pedido estourou o tempo, 502 sem resposta, 500 para o resto. */
export function errorScreenCodeOf(error: unknown): number {
  if (!isAxiosError(error)) return 500;
  if (error.response) return resolveErrorScreen(error.response.status)?.code ?? 500;
  return error.code === "ECONNABORTED" ? 408 : 502;
}
