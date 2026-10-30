import { ScopeSelect } from "@/components/ScopeSelect";
import type { Block } from "@/lib/api/generated/models";

/**
 * O bloco de uma lista de unidades, num seletor **acima da busca**, como o condomínio (com busca digitada, no máximo 6 opções): é um recorte
 * da lista (de que parte do condomínio ela fala), não um filtro da unidade, que fica no ícone dentro da busca. Só aparece se o condomínio tem
 * blocos. `onCard` é para a lista dentro de um cartão branco (o fundo do campo muda para não sumir).
 */
export function UnitBlockSelect({
  blocks,
  value,
  onChange,
  onCard = false,
}: {
  blocks: readonly Block[];
  value: string;
  onChange: (value: string) => void;
  onCard?: boolean;
}) {
  if (blocks.length === 0) return null;

  return (
    <ScopeSelect
      label="Bloco"
      value={value}
      allLabel="Todos os blocos"
      onChange={onChange}
      onCard={onCard}
      options={blocks.map((block) => ({ value: block.id, label: block.name }))}
    />
  );
}
