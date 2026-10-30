/** Seções da página de uma pessoa, na ordem em que aparecem; o índice da direita usa estes ids. */
export const PERSON_SECTIONS = [
  { id: "identificacao", label: "Identificação" },
  { id: "contato", label: "Contato" },
] as const;

export const personsUrl = () => "/condominiums/persons";
export const newPersonUrl = () => "/condominiums/persons/new";
export const personUrl = (personId: string) => `/condominiums/persons/${personId}`;

/** Os papéis de uma pessoa numa unidade, como o usuário os lê. */
export const UNIT_ROLE_LABELS = { owner: "Proprietário", tenant: "Inquilino" } as const;

export interface PersonsFrameState {
  /** A coluna da lista só envolve as telas do cadastro de pessoas: a vazia, o cadastro novo e a pessoa aberta. */
  hasFrame: boolean;
  personId: string | null;
  isNew: boolean;
  /** No celular a lista e a pessoa aberta são telas separadas. */
  showListOnPhone: boolean;
  showPageOnPhone: boolean;
}

/** Que moldura uma URL tem: `/condominiums/persons` (a vazia), `/condominiums/persons/new` e `/condominiums/persons/[personId]`. */
export function personsFrameState(pathname: string | null): PersonsFrameState {
  const none: PersonsFrameState = { hasFrame: false, personId: null, isNew: false, showListOnPhone: false, showPageOnPhone: true };
  if (!pathname) return none;
  const [, root, second, third, extra] = pathname.split("/");
  if (root !== "condominiums" || second !== "persons" || extra !== undefined) return none;

  if (third === undefined || third === "") {
    return { ...none, hasFrame: true, showListOnPhone: true, showPageOnPhone: false };
  }
  if (third === "new") return { ...none, hasFrame: true, isNew: true };
  return { ...none, hasFrame: true, personId: third };
}
