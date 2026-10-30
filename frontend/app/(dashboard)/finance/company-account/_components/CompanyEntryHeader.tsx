"use client";

import { BackLink } from "@/components/BackLink";
import { Skeleton } from "@/components/ui/skeleton";
import { useCompanyEntriesRetrieve } from "@/lib/api/generated";
import { companyAccountUrl } from "@/lib/company-account-workspace";

/** Client Component: a descrição do lançamento aberto. No celular, onde a lista não fica ao lado, tem o "voltar" à lista no alto. */
export function CompanyEntryHeader({ entryId }: { entryId: string }) {
  const { data: entry } = useCompanyEntriesRetrieve(entryId);

  const back = (
    <div className="lg:hidden">
      <BackLink href={companyAccountUrl()} label="Conta da imobiliária" />
    </div>
  );

  if (!entry)
    return (
      <>
        {back}
        <Skeleton className="mb-6 h-9 w-72 rounded-control" />
      </>
    );

  return (
    <>
      {back}
      <h1 className="mb-6 text-title">{entry.description}</h1>
    </>
  );
}
