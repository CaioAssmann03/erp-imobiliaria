"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/lib/download";
import { toast } from "@/lib/toast";

/** Client Component: baixa o PDF de um relatório (a função busca o arquivo; o nome vem pronto). */
export function ReportDownloadButton({
  fileName,
  fetchPdf,
  disabled,
  variant = "secondary",
  className,
}: {
  fileName: string;
  fetchPdf: () => Promise<Blob>;
  disabled?: boolean;
  variant?: "secondary" | "link";
  className?: string;
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
    // O Base UI põe o atributo `disabled` só no cliente; sem isto o botão desativado já no 1º desenho avisa de hidratação.
    <Button type="button" variant={variant} className={className} onClick={handleClick} disabled={disabled || isDownloading} suppressHydrationWarning>
      {isDownloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
      Baixar PDF
    </Button>
  );
}
