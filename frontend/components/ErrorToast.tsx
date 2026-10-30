"use client";

import { ChevronDown, OctagonXIcon, X } from "lucide-react";
import { useState } from "react";

import type { ErrorDetails } from "@/lib/error-details";
import { cn } from "@/lib/utils";

/**
 * O aviso de erro, nas cores contrárias ao modo (escuro no claro, claro no escuro: `bg-ink` e `text-ink-foreground` já se invertem). Quando o erro
 * veio da API ele pode ser aberto com um clique, que mostra o que o servidor respondeu: o status, a requisição e, para cada erro, o código, o campo e a
 * mensagem original. Sem detalhes (um aviso que a tela mesma escreve) é só a mensagem.
 */
export function ErrorToast({ message, details, onClose }: { message: string; details?: ErrorDetails; onClose: () => void }) {
  const [open, setOpen] = useState(false);
  const expandable = details !== undefined;

  return (
    <div
      role="alert"
      className={cn(
        "w-full rounded-card bg-ink p-3 text-body text-ink-foreground shadow-float",
        expandable && "cursor-pointer"
      )}
      onClick={expandable ? () => setOpen((current) => !current) : undefined}
    >
      <div className="flex items-start gap-2.5">
        <OctagonXIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
        <p className="min-w-0 flex-1">{message}</p>
        {expandable && (
          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? "Ocultar detalhes do erro" : "Ver detalhes do erro"}
            className="-m-1 flex size-6 shrink-0 items-center justify-center rounded-control opacity-70 outline-none transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ink-foreground/50"
            onClick={(event) => {
              event.stopPropagation();
              setOpen((current) => !current);
            }}
          >
            <ChevronDown aria-hidden className={cn("size-4 transition-transform", open && "rotate-180")} />
          </button>
        )}
        <button
          type="button"
          aria-label="Fechar aviso"
          className="-m-1 flex size-6 shrink-0 items-center justify-center rounded-control opacity-70 outline-none transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ink-foreground/50"
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>

      {expandable && open && (
        <dl className="mt-2.5 space-y-1.5 border-t border-ink-foreground/20 pt-2.5 text-caption">
          {details.status !== null && <Row label="Resposta" value={`HTTP ${details.status}`} />}
          {details.status === null && <Row label="Resposta" value="O servidor não respondeu" />}
          {details.request && <Row label="Requisição" value={details.request} mono />}
          {details.items.map((item, index) => (
            <div key={index} className="space-y-1.5 border-t border-ink-foreground/10 pt-1.5 first:border-t-0 first:pt-0">
              {item.field && <Row label="Campo" value={item.field} mono />}
              <Row label="Código" value={item.code} mono />
              <Row label="Mensagem do servidor" value={item.message} />
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="opacity-70">{label}</dt>
      <dd className={cn("break-words", mono && "font-mono")}>{value}</dd>
    </div>
  );
}
