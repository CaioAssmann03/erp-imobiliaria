import type { CompanyEntry } from "@/lib/api/generated/models";
import { companyEntryUrl } from "@/lib/finance/company-account-workspace";
import { brl, formatDate } from "@/lib/format/format";
import { RegistryListItem } from "@/components/layout/RegistryList";

/**
 * Um lançamento da imobiliária na lista no padrão da lista de condomínios: a descrição em cima e embaixo a data e o valor. `isOpen` marca o
 * aberto e `dimmed` apaga os outros quando há um aberto (voltam ao passar o mouse ou focar).
 */
export function CompanyEntryListItem({ entry, isOpen = false, dimmed = false }: { entry: CompanyEntry; isOpen?: boolean; dimmed?: boolean }) {
  return (
    <RegistryListItem href={companyEntryUrl(entry.id)} isOpen={isOpen} dimmed={dimmed}>
      <span className="block truncate text-body font-medium">{entry.description}</span>
      <span className="block truncate text-caption tabular-nums text-ink-soft">
        {formatDate(entry.entry_date)} · {brl(entry.amount)}
      </span>
    </RegistryListItem>
  );
}
