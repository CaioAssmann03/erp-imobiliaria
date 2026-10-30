import { z } from "zod";

import type { SupplierAccountKind } from "@/lib/api/generated/models";
import { dateField, emailField, enumField, optionalText, phoneField } from "./fields";
import { documentError, personToPayload, type PersonFormOutput } from "./person";

export const SUPPLIER_ACCOUNT_KINDS = [
  { value: "checking", label: "Conta corrente" },
  { value: "savings", label: "Poupança" },
] as const;

/**
 * O fornecedor novo, criado de dentro da conta a pagar: a pessoa (uma que já existe, ou uma nova só com tipo, nome e documento) e os dados de pagamento,
 * todos opcionais. Banco, agência e conta vêm juntos ou nenhum (a regra do modelo); a chave Pix pode vir sozinha.
 */
export const supplierSchema = z
  .object({
    // Só existem no formulário: se a pessoa é nova, e o tipo do documento dela.
    new_person: z.boolean(),
    person: z.string(),
    kind: enumField(["individual", "legal"]),
    name: z.string(),
    document: z.string(),
    // O resto da pessoa nova é o da tela de Pessoas (sempre opcional aqui).
    rg: optionalText("RG", 10),
    ie: optionalText("Inscrição estadual", 20),
    birthday: dateField("Data de nascimento", { min: "1900-01-01", max: "today" }),
    marital_status: optionalText("Estado civil", 30),
    job: optionalText("Profissão", 120),
    home_phone: phoneField,
    business_phone: phoneField,
    cell_number: phoneField,
    email: emailField,
    bank_code: optionalText("Banco", 3),
    branch: optionalText("Agência", 10),
    account_number: optionalText("Conta", 20),
    account_kind: z.string(),
    pix_key: optionalText("Chave Pix", 140),
  })
  .superRefine((values, context) => {
    if (!values.new_person && !values.person) {
      context.addIssue({ code: "custom", path: ["person"], message: "Escolha a pessoa ou cadastre uma nova" });
    }
    if (values.new_person) {
      if (values.name.trim().length < 2) context.addIssue({ code: "custom", path: ["name"], message: "Informe o nome" });
      const error = documentError(values);
      if (error) context.addIssue({ code: "custom", path: ["document"], message: error });
    }
    const bank = { bank_code: values.bank_code, branch: values.branch, account_number: values.account_number };
    const filled = Object.values(bank).filter(Boolean).length;
    if (filled > 0 && filled < 3) {
      for (const [field, value] of Object.entries(bank)) {
        if (!value) context.addIssue({ code: "custom", path: [field], message: "Informe banco, agência e conta juntos" });
      }
    }
  });

export type SupplierFormInput = z.input<typeof supplierSchema>;
export type SupplierFormOutput = z.output<typeof supplierSchema>;

export const SUPPLIER_DEFAULTS: SupplierFormInput = {
  new_person: false,
  person: "",
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
  bank_code: "",
  branch: "",
  account_number: "",
  account_kind: "",
  pix_key: "",
};

/** O corpo da pessoa nova no formato da API (só o que o formulário pede; o resto fica vazio). */
export const newPersonPayload = (values: SupplierFormOutput): Record<string, unknown> =>
  personToPayload(
    {
      kind: values.kind,
      name: values.name,
      document: values.document,
      rg: values.rg,
      ie: values.ie,
      birthday: values.birthday,
      marital_status: values.marital_status,
      job: values.job,
      home_phone: values.home_phone,
      business_phone: values.business_phone,
      cell_number: values.cell_number,
      email: values.email,
      active: true,
    } as PersonFormOutput,
    false
  );

/** O corpo do fornecedor no formato da API, para a pessoa `personId`. */
export const supplierToPayload = (values: SupplierFormOutput, personId: string): Record<string, unknown> => ({
  person: personId,
  bank_code: values.bank_code,
  branch: values.branch,
  account_number: values.account_number,
  account_kind: (values.account_kind || undefined) as (typeof SupplierAccountKind)[keyof typeof SupplierAccountKind] | undefined,
  pix_key: values.pix_key,
});
