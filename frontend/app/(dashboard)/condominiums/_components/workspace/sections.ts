/** As seções do cadastro de um condomínio, na ordem da página; o menu da direita rola até o `id` de cada uma (spec 038). */
export const WORKSPACE_SECTIONS = [
  { id: "dados-gerais", label: "Dados gerais" },
  { id: "taxa-de-administracao", label: "Taxa de administração" },
  { id: "dados-de-cobranca", label: "Dados de cobrança" },
  { id: "configuracoes", label: "Configurações" },
] as const;

export type WorkspaceSectionId = (typeof WORKSPACE_SECTIONS)[number]["id"];
