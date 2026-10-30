import type { Person } from "@/lib/api/generated/models";
import { maskCpfCnpj } from "@/lib/format/masks";

/** CPF (pessoa física) ou CNPJ (pessoa jurídica) só com dígitos; vazio se não houver documento. */
export const personDocument = (person: Person) =>
  person.people_individual?.cpf ?? person.people_legal?.cnpj ?? "";

/** O mesmo documento, formatado para exibição. */
export const formattedPersonDocument = (person: Person) => maskCpfCnpj(personDocument(person));
