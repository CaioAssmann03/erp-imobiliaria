import { z } from "zod";

import type { Unidade } from "@/lib/api/generated/models";
import { decimalFromApi, moneyFromApi } from "@/lib/masks";

import { decimalField, enumField, intField, optionalText, requiredText } from "./fields";

const MAX_MONEY = 999_999.99; // numeric(8, 2)

export const UNIDADE_TIPOS = [
  { value: "apartamento", label: "Apartamento" },
  { value: "sala", label: "Sala" },
  { value: "loja", label: "Loja" },
  { value: "casa", label: "Casa" },
  { value: "conjunto", label: "Conjunto" },
  { value: "box", label: "Box" },
  { value: "outros", label: "Outros" },
] as const;

export const unidadeSchema = z.object({
  nome_unidade: requiredText("a unidade", { max: 30 }),
  bloco: z.string().transform((value) => (value ? Number(value) : null)),
  tipo: enumField(UNIDADE_TIPOS.map((t) => t.value) as [string, ...string[]]),
  matricula_imovel: optionalText("Matrícula do imóvel", 60),
  numero_moradores: intField("Nº de moradores", 0, 999),
  // numeric(8, 5): até 3 dígitos inteiros
  fracao_ideal: decimalField("Fração ideal", { max: 999.99999, decimals: 5 }),
  eh_unidade_sindico: z.boolean(),
  esta_alugada: z.boolean(),
  bloqueio_lancamentos: z.boolean(),
  ativo: z.boolean(),
  valor_gas: decimalField("Valor do gás", { max: MAX_MONEY }),
  valor_agua: decimalField("Valor da água", { max: MAX_MONEY }),
  valor_energia: decimalField("Valor da energia", { max: MAX_MONEY }),
});

export type UnidadeFormInput = z.input<typeof unidadeSchema>;
export type UnidadeFormOutput = z.output<typeof unidadeSchema>;

export const UNIDADE_DEFAULTS: UnidadeFormInput = {
  nome_unidade: "",
  bloco: "",
  tipo: "apartamento",
  matricula_imovel: "",
  numero_moradores: "0",
  fracao_ideal: "",
  eh_unidade_sindico: false,
  esta_alugada: false,
  bloqueio_lancamentos: false,
  ativo: true,
  valor_gas: "",
  valor_agua: "",
  valor_energia: "",
};

export function unidadeToForm(u: Unidade): UnidadeFormInput {
  return {
    nome_unidade: u.nome_unidade,
    bloco: u.bloco ? String(u.bloco) : "",
    tipo: u.tipo ?? "apartamento",
    matricula_imovel: u.matricula_imovel ?? "",
    numero_moradores: String(u.numero_moradores ?? 0),
    fracao_ideal: decimalFromApi(u.fracao_ideal, 5),
    eh_unidade_sindico: u.eh_unidade_sindico ?? false,
    esta_alugada: u.esta_alugada ?? false,
    bloqueio_lancamentos: u.bloqueio_lancamentos ?? false,
    ativo: u.ativo ?? true,
    valor_gas: moneyFromApi(u.valor_gas),
    valor_agua: moneyFromApi(u.valor_agua),
    valor_energia: moneyFromApi(u.valor_energia),
  };
}
