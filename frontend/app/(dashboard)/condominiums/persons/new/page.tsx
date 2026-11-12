import type { Metadata } from "next";

import { PhoneBackLink } from "@/components/layout/BackLink";
import { personsUrl } from "@/lib/persons/person-workspace";
import { PersonForm } from "../_components/PersonForm";

export const metadata: Metadata = { title: "Nova pessoa" };

export default function NewPersonPage() {
  return (
    <>
      <div className="mb-6">
        <PhoneBackLink href={personsUrl()} label="Pessoas" />
        <h1 className="text-title">Nova pessoa</h1>
      </div>
      <PersonForm />
    </>
  );
}
