import { uuidParam } from "../api/uuid-param.ts";
import { registryFrame } from "../navigation/registry-frame.ts";
import { scopeUrl } from "../navigation/url-scope.ts";

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

const withContext = (path: string, context: PersonContext): string =>
  scopeUrl(path, { condominium: context.condominium ?? "", unit: context.unit ?? "", from: context.from ?? "" });

export const personsUrl = (context: PersonContext = {}) => withContext("/condominiums/persons", context);
/** A tela de nova pessoa; o `context` mantém a lista da esquerda filtrada no que se olhava (as pessoas do condomínio ou da unidade). */
export const newPersonUrl = (context: PersonContext = {}) => withContext("/condominiums/persons/new", context);
/** A pessoa aberta; o `context` (de onde se chegou) mantém a lista filtrada e leva o "voltar" de volta à tela de origem. */
export const personUrl = (personId: string, context: PersonContext = {}) => withContext(`/condominiums/persons/${personId}`, context);

/** Um id lido de `?condominium=` ou `?unit=`; só um UUID vale (o valor entra num endereço). */
export const originCondominium = uuidParam;

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
  const { id, ...frame } = registryFrame(pathname, "condominiums", "persons");
  return { ...frame, personId: id };
}
