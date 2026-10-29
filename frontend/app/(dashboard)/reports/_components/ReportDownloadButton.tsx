"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/lib/download";

/** Client Component: baixa o PDF de um relatório (a função busca o arquivo; o nome vem pronto). */
export function ReportDownloadButton({
  fileName,
  fetchPdf,
  disabled,
}: {
  fileName: string;
  fetchPdf: () => Promise<Blob>;
  disabled?: boolean;
}) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleClick = async () => {
    setIsDownloading(true);
    try {
      downloadBlob(await fetchPdf(), fileName);
    } catch {
      toast.error("Não foi possível gerar o PDF. Tente de novo.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button type="button" variant="secondary" onClick={handleClick} disabled={disabled || isDownloading}>
      {isDownloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
      Baixar PDF
    </Button>
  );
}
