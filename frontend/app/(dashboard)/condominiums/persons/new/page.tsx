import type { Metadata } from "next";

import { BackLink } from "@/components/BackLink";
import { personsUrl } from "@/lib/person-workspace";
import { PersonForm } from "../_components/PersonForm";

export const metadata: Metadata = { title: "Nova pessoa" };

export default function NewPersonPage() {
  return (
    <>
      <div className="mb-6">
        <div className="lg:hidden">
          <BackLink href={personsUrl()} label="Pessoas" />
        </div>
        <h1 className="text-title">Nova pessoa</h1>
      </div>
      <PersonForm />
    </>
  );
}
