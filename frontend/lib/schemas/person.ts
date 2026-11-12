import { z } from "zod";

import type { Person } from "@/lib/api/generated/models";
import { maskCpf, maskCnpj, maskPhone, onlyDigits } from "@/lib/format/masks";
import { isValidCnpj, isValidCpf } from "@/lib/format/validators";

import {
  dateField,
  emailField,
  enumField,
  optionalText,
  phoneField,
  requiredText,
} from "./fields";

export const PERSON_KINDS = [
  { value: "individual", label: "Pessoa física" },
  { value: "legal", label: "Pessoa jurídica" },
] as const;

export const MARITAL_STATUSES = ["Solteiro(a)", "Casado(a)", "Divorciado(a)", "Viúvo(a)", "União estável"];

type DocumentInput = { kind: string; document: string };

export function documentError(values: DocumentInput): string | null {
  const digits = onlyDigits(values.document ?? "");
  const isCpf = values.kind === "individual";
  const label = isCpf ? "CPF" : "CNPJ";
  if (!digits) return `Informe o ${label}`;
  if (isCpf ? !isValidCpf(digits) : !isValidCnpj(digits)) {
    return `${label} inválido. Confira os dígitos`;
  }
  return null;
}

export const personSchema = z
  .object({
    // Só existe no formulário: decide se o documento é CPF (individual) ou CNPJ (legal).
    kind: enumField(["individual", "legal"]),
    name: requiredText("o nome", { min: 2, max: 255 }),
    document: z.string(),
    rg: optionalText("RG", 10),
    ie: optionalText("Inscrição estadual", 20),
    birthday: dateField("Data de nascimento", { min: "1900-01-01", max: "today" }),
    marital_status: optionalText("Estado civil", 30),
    job: optionalText("Profissão", 120),
    home_phone: phoneField,
    business_phone: phoneField,
    cell_number: phoneField,
    email: emailField,
    active: z.boolean(),
  })
  // `when: () => true`: valida o documento mesmo que outros campos já tenham falhado,
  // para o usuário ver todos os erros de uma vez.
  .refine((values) => documentError(values) === null, {
    path: ["document"],
    when: () => true,
    error: (issue) => documentError(issue.input as DocumentInput) ?? "Documento inválido",
  });

export type PersonFormInput = z.input<typeof personSchema>;
export type PersonFormOutput = z.output<typeof personSchema>;

export const PERSON_DEFAULTS: PersonFormInput = {
  kind: "individual",
  name: "",
  document: "",
  rg: "",
  ie: "",
  birthday: "",
  marital_status: "",
  job: "",
  home_phone: "",
  business_phone: "",
  cell_number: "",
  email: "",
  active: true,
};

export function personToForm(person: Person): PersonFormInput {
  const legal = person.people_legal;
  const individual = person.people_individual;
  const kind = legal && !individual ? "legal" : "individual";
  return {
    kind,
    name: person.name,
    document: kind === "legal" ? maskCnpj(legal?.cnpj ?? "") : maskCpf(individual?.cpf ?? ""),
    rg: individual?.rg ?? "",
    ie: legal?.ie ?? "",
    birthday: individual?.birthday ?? "",
    marital_status: individual?.marital_status ?? "",
    job: individual?.job ?? "",
    home_phone: maskPhone(person.home_phone ?? ""),
    business_phone: maskPhone(person.business_phone ?? ""),
    cell_number: maskPhone(person.cell_number ?? ""),
    email: person.email ?? "",
    active: person.active ?? true,
  };
}

/**
 * Corpo da requisição no formato da API: pessoa + `people_individual` ou `people_legal`.
 * Na edição (PATCH) um campo esvaziado vai como `null` (ou "" no email), senão o valor
 * antigo permanece.
 */
export function personToPayload(
  values: PersonFormOutput,
  isEdit: boolean
): Record<string, unknown> {
  const empty = isEdit ? null : undefined;
  const digits = onlyDigits(values.document);

  const nested =
    values.kind === "individual"
      ? {
          people_individual: {
            cpf: digits,
            rg: values.rg ?? empty,
            birthday: values.birthday ?? empty,
            marital_status: values.marital_status ?? empty,
            job: values.job ?? empty,
          },
        }
      : { people_legal: { cnpj: digits, ie: values.ie ?? empty } };

  return {
    name: values.name,
    home_phone: values.home_phone ?? empty,
    business_phone: values.business_phone ?? empty,
    cell_number: values.cell_number ?? empty,
    email: values.email ?? (isEdit ? "" : undefined),
    active: values.active,
    ...nested,
  };
}
