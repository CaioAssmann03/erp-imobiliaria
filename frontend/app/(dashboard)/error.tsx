"use client";

import { LinkButton } from "@/components/LinkButton";
import { Button } from "@/components/ui/button";

/** Um erro inesperado ao montar a página: mensagem em português e as saídas, sem expor o detalhe técnico. */
export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md space-y-4 py-16 text-center" role="alert">
      <h1 className="text-title">Algo deu errado</h1>
      <p className="text-body text-ink-soft">Não foi possível carregar esta página. Tente de novo; se continuar, volte ao painel.</p>
      <div className="flex justify-center gap-2">
        <Button type="button" onClick={reset}>
          Tentar de novo
        </Button>
        <LinkButton variant="secondary" href="/">
          Ir ao painel
        </LinkButton>
      </div>
    </div>
  );
}
