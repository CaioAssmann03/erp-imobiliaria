import { ScopeSearchCard } from "@/components/filters/ScopeSearchCard";

import { ReportDownloadButton } from "./ReportDownloadButton";

/**
 * O alto de um relatório: o cartão dos seletores (condomínio, mês) e, colado ao lado, o botão do PDF, do mesmo tamanho do cartão. Em tela
 * estreita o botão desce para baixo do cartão. É igual em todos os relatórios, para o PDF ficar sempre no mesmo lugar.
 */
export function ReportFilterBar({
  scopes,
  fileName,
  fetchPdf,
  disabled,
}: {
  scopes: React.ReactNode;
  fileName: string;
  fetchPdf: () => Promise<Blob>;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="min-w-0 max-w-xl flex-1 basis-80">
        <ScopeSearchCard scopes={scopes} />
      </div>
      <ReportDownloadButton fileName={fileName} fetchPdf={fetchPdf} disabled={disabled} className="h-12 px-5" />
    </div>
  );
}
