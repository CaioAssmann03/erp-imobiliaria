"use client";

import { ErrorScreen } from "@/components/ErrorScreen";
import { errorScreenCodeOf } from "@/lib/error-screens";

/** Falha ao montar ou carregar a página: a tela do código (403, 5xx, rede...) ou a 500, sem expor o detalhe técnico. */
export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorScreen code={errorScreenCodeOf(error)} onRetry={reset} reference={error.digest} />;
}
