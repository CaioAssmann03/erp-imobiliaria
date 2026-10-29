"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { ExtraBillingResult } from "@/lib/api/generated/models";
import { describeProblem, problemFix } from "@/lib/billing-run-problems";
import { brl, formatDate } from "@/lib/format";

interface ExtraResultProps {
  result: ExtraBillingResult;
  condominiumId: string;
  /** Volta ao formulário com o que foi preenchido (para corrigir e emitir de novo). */
  onEdit: () => void;
  /** Começa um boleto extra novo, com o formulário em branco. */
  onNew: () => void;
}

/** O que a emissão fez: os boletos emitidos e, para cada unidade pulada, o motivo e onde corrigir. */
export function ExtraResult({ result, condominiumId, onEdit, onNew }: ExtraResultProps) {
  const total = result.issued.reduce((sum, document) => sum + Math.round(Number(document.amount) * 100), 0) / 100;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <section className="rounded-card bg-card p-6 shadow-card">
        <h2 className="text-heading">{result.issued.length > 0 ? `${result.issued.length} boleto(s) emitido(s)` : "Nenhum boleto foi emitido"}</h2>
        {result.issued.length > 0 && (
          <>
            <ul className="mt-3 divide-y divide-line">
              {result.issued.map((document) => (
                <li key={document.id} className="flex items-center justify-between gap-3 py-2 text-body">
                  <Link href={`/billing/documents/${document.id}`} className="font-medium hover:underline">
                    Unidade {document.unit_name}
                  </Link>
                  <span className="text-ink-soft">
                    {document.payer_name} · vence em {formatDate(document.due_date)}
                  </span>
                  <span className="tabular-nums">{brl(document.amount)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 flex justify-between border-t border-line pt-3 text-body font-medium">
              <span>Total</span>
              <span className="tabular-nums">{brl(total)}</span>
            </p>
            <p className="mt-2 text-caption text-ink-soft">O PDF de cada boleto é gerado em instantes e o registro no banco segue a conta da imobiliária.</p>
          </>
        )}
      </section>
      {result.skipped.length > 0 && (
        <section className="rounded-card bg-card p-6 shadow-card">
          <h2 className="text-heading">Unidades que ficaram de fora</h2>
          <ul className="mt-3 divide-y divide-line">
            {result.skipped.map((item) => {
              const nothingToBill = item.code === "nothing_to_bill";
              const fix = nothingToBill ? null : problemFix(item.code, { condominiumId, unitId: item.unit });
              return (
                <li key={item.unit} className="flex flex-wrap items-center justify-between gap-2 py-2 text-body">
                  <span>
                    <span className="font-medium">Unidade {item.unit_name}</span> —{" "}
                    {nothingToBill ? "nenhum valor ficou para esta unidade (confira a fração dela no critério de rateio)." : describeProblem(item.code)}
                  </span>
                  {fix && (
                    <Link href={fix.href} className="text-brand hover:underline">
                      {fix.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onEdit}>
          Voltar ao formulário
        </Button>
        <Button type="button" onClick={onNew}>
          Novo boleto extra
        </Button>
      </div>
    </div>
  );
}
