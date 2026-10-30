/** Seções da página de uma pessoa, na ordem em que aparecem; o índice da direita usa estes ids. */
export const PERSON_SECTIONS = [
  { id: "identificacao", label: "Identificação" },
  { id: "contato", label: "Contato" },
] as const;

/** O contexto de onde se chegou às pessoas: o condomínio e a unidade que filtram a lista e a tela (`from`) a que o "voltar" da pessoa leva. */
export interface PersonContext {
  condominium?: string | null;
  unit?: string | null;
  from?: string | null;
}

function contextQuery(context: PersonContext): string {
  const params = new URLSearchParams();
  if (context.condominium) params.set("condominium", context.condominium);
  if (context.unit) params.set("unit", context.unit);
  if (context.from) params.set("from", context.from);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export const personsUrl = (context: PersonContext = {}) => `/condominiums/persons${contextQuery(context)}`;
export const newPersonUrl = () => "/condominiums/persons/new";
/** A pessoa aberta; o `context` (de onde se chegou) mantém a lista filtrada e leva o "voltar" de volta à tela de origem. */
export const personUrl = (personId: string, context: PersonContext = {}) => `/condominiums/persons/${personId}${contextQuery(context)}`;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Um id lido de `?condominium=` ou `?unit=`; só um UUID vale (o valor entra num endereço). */
export const originCondominium = (value: string | null) => (value && UUID.test(value) ? value : null);

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
