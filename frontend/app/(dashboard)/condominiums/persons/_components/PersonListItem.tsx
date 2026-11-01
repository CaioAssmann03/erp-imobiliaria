import type { Person } from "@/lib/api/generated/models";
import { formatCode } from "@/lib/format/format";
import { formattedPersonDocument } from "@/lib/persons/person-document";
import { type PersonContext, personUrl } from "@/lib/persons/person-workspace";
import { RegistryListItem } from "@/components/layout/RegistryList";

/**
 * Uma pessoa na lista no padrão da lista de condomínios: o código (cinza) e o nome em cima; embaixo o CPF/CNPJ (ou o e-mail) e "Inativa".
 * `isOpen` marca a aberta e `dimmed` apaga as outras quando há uma aberta (voltam ao passar o mouse ou focar).
 */
export function PersonListItem({
  person,
  isOpen = false,
  dimmed = false,
  context,
}: {
  person: Person;
  isOpen?: boolean;
  dimmed?: boolean;
  /** De onde se chegou (condomínio, unidade e tela de origem): a lista continua filtrada e o "voltar" da pessoa leva à origem. */
  context?: PersonContext;
}) {
  const sub = [formattedPersonDocument(person) || person.email, person.active ? null : "Inativa"].filter(Boolean).join(" · ");

  return (
    <RegistryListItem href={personUrl(person.id, context)} isOpen={isOpen} dimmed={dimmed}>
      <span className="block truncate text-body font-medium">
        <span className="tabular-nums">{formatCode(person.code)}</span>
        <span className="text-ink-faint"> · </span>
        {person.name}
      </span>
      <span className="block truncate text-caption text-ink-soft">{sub || "—"}</span>
    </RegistryListItem>
  );
}
