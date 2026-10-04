"use client";

import { toast } from "sonner";

import { FormSection } from "@/components/form/FormSection";
import { useUnitPeopleDestroy } from "@/lib/api/generated";
import type { UnitPerson } from "@/lib/api/generated/models";

import { UnitPeopleList } from "./UnitPeopleList";
import { UnitPersonForm } from "./UnitPersonForm";

interface UnitPeopleSectionProps {
  unitId: string;
  links: readonly UnitPerson[];
  onChanged: () => void;
}

/** Proprietários e locatários da unidade: lista com remoção e formulário de novo vínculo. */
export function UnitPeopleSection({ unitId, links, onChanged }: UnitPeopleSectionProps) {
  const destroyMutation = useUnitPeopleDestroy();

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
    <FormSection title="Proprietários e locatários" description="Pessoas vinculadas a esta unidade.">
      <UnitPeopleList links={links} onRemove={handleRemove} />
      <UnitPersonForm unitId={unitId} onCreated={onChanged} />
    </FormSection>
  );
}
