"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/lib/errors/toast";

/** Copia um texto para a área de transferência (linha digitável, código Pix) e avisa que copiou. */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label} copiado.`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar; selecione o texto e copie manualmente.");
    }
  };

  return (
    <Button type="button" variant="ghost" size="sm" onClick={copy} aria-label={`Copiar ${label.toLowerCase()}`}>
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {copied ? "Copiado" : "Copiar"}
    </Button>
  );
}
