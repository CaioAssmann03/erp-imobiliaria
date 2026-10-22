import { Suspense } from "react";

import { PageHeader } from "@/components/PageHeader";

import { CondominiumList } from "../_components/workspace/CondominiumList";

/** O cadastro de condomínios numa tela só (spec 038): a lista à esquerda e, ao lado, o condomínio aberto. */
export default function CondominiumWorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <PageHeader title="Condomínios" description="Cadastro e gestão dos condomínios administrados." />
      <div className="lg:grid lg:grid-cols-[19rem_minmax(0,1fr)] lg:items-start lg:gap-4">
        {/* A lista lê `?pending=` do endereço (useSearchParams), que pede um limite de Suspense. */}
        <Suspense fallback={null}>
          <CondominiumList />
        </Suspense>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
