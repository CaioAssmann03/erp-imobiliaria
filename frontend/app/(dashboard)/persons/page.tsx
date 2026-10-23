import type { Metadata } from "next";

import { LinkButton } from "@/components/LinkButton";
import { PageHeader } from "@/components/PageHeader";
import { PersonsTable } from "./_components/PersonsTable";

export const metadata: Metadata = { title: "Pessoas" };

export default function PersonsPage() {
  return (
    <div>
      <PageHeader
        title="Pessoas"
        description="Proprietários, locatários e demais contatos."
        actions={<LinkButton href="/persons/new">Nova pessoa</LinkButton>}
      />
      <PersonsTable />
    </div>
  );
}
