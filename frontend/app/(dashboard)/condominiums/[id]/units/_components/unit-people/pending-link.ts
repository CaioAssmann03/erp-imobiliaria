import type { Person, UnitPerson } from "@/lib/api/generated/models";

/**
 * Um vínculo de pessoa com a unidade que ainda não foi salvo: na unidade nova o proprietário e o inquilino são escolhidos antes de a unidade existir
 * e só são gravados depois dela (a unidade vai primeiro; o vínculo precisa do id dela).
 */
export interface PendingLink {
  key: string;
  person: Person;
  role: "owner" | "tenant";
  ownership_percentage: string | null;
  start_date: string;
  end_date: string | null;
}

let counter = 0;
export const newPendingKey = () => `pending-${++counter}`;

/** O vínculo no formato que a lista e o resumo mostram (o mesmo do vínculo salvo). */
export const pendingLinkRow = (link: PendingLink) => ({
  id: link.key,
  role: link.role,
  ownership_percentage: link.ownership_percentage,
  start_date: link.start_date,
  end_date: link.end_date,
  person_detail: link.person,
});

/** O corpo do vínculo na API, para a unidade `unitId`. */
export const pendingLinkPayload = (link: PendingLink, unitId: string): UnitPerson =>
  ({
    unit: unitId,
    person: link.person.id,
    role: link.role,
    start_date: link.start_date,
    end_date: link.end_date,
    ownership_percentage: link.role === "owner" ? link.ownership_percentage : null,
  }) as UnitPerson;
