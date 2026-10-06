"use client";

import { useState } from "react";

import { FormField } from "@/components/form/FormField";
import { FormSection } from "@/components/form/FormSection";
import { useCondominiumsList } from "@/lib/api/generated";
import { inputClass } from "@/lib/ui";

import { UnitForm } from "../[id]/units/_components/UnitForm";

/** Cadastro de unidade a partir da aba Unidades: escolhe o condomínio e abre o formulário. */
export function NewUnitForm() {
  const { data } = useCondominiumsList({ limit: 100 });
  const [condominiumId, setCondominiumId] = useState("");

  return (
    <div className="space-y-4">
      <FormSection title="Condomínio">
        <FormField id="new-unit-condominium" label="Condomínio" required>
          <select
            id="new-unit-condominium"
            className={inputClass}
            value={condominiumId}
            onChange={(event) => setCondominiumId(event.target.value)}
          >
            <option value="">Selecione</option>
            {(data?.results ?? []).map((condominium) => (
              <option key={condominium.id} value={condominium.id}>
                {condominium.name}
              </option>
            ))}
          </select>
        </FormField>
      </FormSection>
      {condominiumId && (
        <UnitForm key={condominiumId} condominiumId={condominiumId} listUrl="/condominiums/units" />
      )}
    </div>
  );
}
