"use client";

import { toast } from "sonner";

import { FormSection } from "@/components/form/FormSection";
import { useUnitPeopleDestroy } from "@/lib/api/generated";
import type { UnitPerson } from "@/lib/api/generated/models";

import { UnitPeopleList } from "./UnitPeopleList";
import { UnitPersonForm } from "./UnitPersonForm";

const TITLES = { owner: "Proprietário", tenant: "Inquilino" } as const;

interface UnitPeopleSectionProps {
  /** Sem unidade (cadastro novo) a seção só avisa que é preciso salvar antes. */
  unitId?: string;
  role: "owner" | "tenant";
  links: readonly UnitPerson[];
  onChanged: () => void;
}

/** Os vínculos de um papel (proprietário ou inquilino): os vigentes primeiro, depois os encerrados, e o formulário para vincular. */
export function UnitPeopleSection({ unitId, role, links, onChanged }: UnitPeopleSectionProps) {
  const destroyMutation = useUnitPeopleDestroy();
  const today = new Date().toISOString().slice(0, 10);
  const ofRole = links
    .filter((link) => link.role === role)
    .toSorted((a, b) => Number(Boolean(a.end_date && a.end_date < today)) - Number(Boolean(b.end_date && b.end_date < today)));

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
        <p className="text-body text-ink-soft">Salve a unidade para vincular pessoas.</p>
      )}
    </FormSection>
  );
}
