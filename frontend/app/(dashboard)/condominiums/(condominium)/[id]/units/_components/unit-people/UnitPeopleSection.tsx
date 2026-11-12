"use client";

import { FormSection } from "@/components/form/FormSection";
import { useUnitPeopleDestroy } from "@/lib/api/generated";
import type { UnitPerson } from "@/lib/api/generated/models";
import { toast } from "@/lib/errors/toast";

import { type PendingLink, pendingLinkRow } from "./pending-link";
import { UnitPeopleList } from "./UnitPeopleList";
import { UnitPersonForm } from "./UnitPersonForm";

const TITLES = { owner: "Proprietário", tenant: "Inquilino" } as const;

interface UnitPeopleSectionProps {
  /** Sem unidade (cadastro novo) os vínculos escolhidos ficam em `pending` e são gravados com a unidade, depois dela. */
  unitId?: string;
  role: "owner" | "tenant";
  links: readonly UnitPerson[];
  onChanged: () => void;
  pending?: readonly PendingLink[];
  onAddPending?: (link: PendingLink) => void;
  onRemovePending?: (key: string) => void;
}

/** Os vínculos de um papel (proprietário ou inquilino): os vigentes primeiro, depois os encerrados, e o formulário para vincular. Na unidade nova os vínculos escolhidos ficam numa lista local e são gravados com a unidade. */
export function UnitPeopleSection({ unitId, role, links, onChanged, pending = [], onAddPending, onRemovePending }: UnitPeopleSectionProps) {
  const destroyMutation = useUnitPeopleDestroy();
  const ofRole = links.filter((link) => link.role === role).toSorted((a, b) => Number(!a.is_current) - Number(!b.is_current));

  const handleRemove = (linkId: string) => {
    destroyMutation.mutate(
      { id: linkId },
      {
        onSuccess: () => {
          toast.success("Vínculo removido.");
          onChanged();
        },
        onError: () => toast.error("Não foi possível remover o vínculo."),
      }
    );
  };

  return (
    <FormSection
      title={TITLES[role]}
      description={
        role === "owner"
          ? "Quem é dono da unidade e a participação de cada um."
          : "Quem ocupa a unidade por locação."
      }
    >
      {unitId ? (
        <>
          <UnitPeopleList links={ofRole} onRemove={handleRemove} />
          <UnitPersonForm unitId={unitId} role={role} onCreated={onChanged} />
        </>
      ) : (
        <>
          <UnitPeopleList links={pending.filter((link) => link.role === role).map(pendingLinkRow)} onRemove={(key) => onRemovePending?.(key)} />
          <UnitPersonForm role={role} onAdd={onAddPending} />
        </>
      )}
    </FormSection>
  );
}
