import type { UnitPerson } from "@/lib/api/generated/models";

export const ROLE_LABELS = { owner: "Proprietário", tenant: "Locatário" } as const;

const formatDate = (iso: string) => iso.split("-").reverse().join("/");

/** "Proprietário · 50% · desde 01/01/2024" */
export function linkSummary(link: UnitPerson) {
  const parts: string[] = [ROLE_LABELS[link.role ?? "tenant"]];
  if (link.ownership_percentage) {
    parts.push(`${Number(link.ownership_percentage).toLocaleString("pt-BR")}%`);
  }
  parts.push(
    link.end_date
      ? `${formatDate(link.start_date)} a ${formatDate(link.end_date)}`
      : `desde ${formatDate(link.start_date)}`
  );
  return parts.join(" · ");
}
