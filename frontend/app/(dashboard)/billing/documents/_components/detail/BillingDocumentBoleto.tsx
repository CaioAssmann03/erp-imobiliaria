import { CopyButton } from "@/components/CopyButton";
import { FormSection } from "@/components/form/FormSection";
import type { BillingDocument } from "@/lib/api/generated/models";
import { boletoState, deliveryFailureLabel, deliveryStatusLabel } from "@/lib/billing-documents";
import { brl, formatDate, formatDateTime } from "@/lib/format";

import { DocumentItem } from "./DocumentItem";

function CodeLine({ label, value }: { label: string; value: string }) {
  return (
    <DocumentItem label={label}>
      <div className="flex flex-wrap items-center gap-2">
        <code className="break-all rounded-control bg-surface-muted px-2 py-1 text-caption">{value}</code>
        <CopyButton value={value} label={label} />
      </div>
    </DocumentItem>
  );
}

/**
 * Server Component: o boleto no gateway (link, linha digitável, Pix), o pagamento e o envio por e-mail.
 * Só leitura; reemitir fica em `BillingDocumentActions`.
 */
export function BillingDocumentBoleto({ document }: { document: BillingDocument }) {
  const state = boletoState({ status: document.status, hasRegistration: document.registration !== null });
  if (state === "none") return null;

  const registration = document.registration;
  const delivery = document.delivery;
  // O link vem do gateway: só abre se for https.
  const boletoUrl = registration?.boleto_url.startsWith("https://") ? registration.boleto_url : null;

  return (
    <FormSection title="Boleto" description="O boleto registrado no gateway de pagamento e o que aconteceu com ele.">
      {state === "waiting" && (
        <p className="text-body text-ink-soft">Ainda não registrado no gateway; o registro acontece logo depois da emissão.</p>
      )}
      {state === "cancelled" && (
        <p className="text-body text-danger">
          O boleto foi cancelado no gateway e não pode mais ser pago. Reemita o boleto para gerar um novo.
        </p>
      )}
      {registration && (state === "active" || state === "paid") && (
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DocumentItem label="Vencimento do boleto">{formatDate(registration.registered_due_date)}</DocumentItem>
          {boletoUrl && (
            <DocumentItem label="Boleto">
              <a href={boletoUrl} target="_blank" rel="noopener noreferrer" className="underline">
                Abrir o boleto
              </a>
            </DocumentItem>
          )}
          {registration.digitable_line && <CodeLine label="Linha digitável" value={registration.digitable_line} />}
          {registration.pix_payload && state === "active" && (
            <CodeLine label="Pix copia e cola" value={registration.pix_payload} />
          )}
        </dl>
      )}
      {state === "paid" && document.payment && (
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <DocumentItem label="Pago em">{formatDate(document.payment.paid_on)}</DocumentItem>
          <DocumentItem label="Valor pago">
            <strong>{brl(document.payment.amount)}</strong>
          </DocumentItem>
          {document.payment.net_amount && (
            <DocumentItem label="Líquido após a taxa">{brl(document.payment.net_amount)}</DocumentItem>
          )}
        </dl>
      )}
      {delivery && (
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <DocumentItem label="E-mail do boleto">
            <span className={delivery.status === "failed" ? "text-danger" : undefined}>
              {deliveryStatusLabel(delivery.status)}
            </span>
            {delivery.failure_reason && (
              <span className="block text-caption text-ink-soft">{deliveryFailureLabel(delivery.failure_reason)}</span>
            )}
          </DocumentItem>
          {delivery.destination && <DocumentItem label="Enviado para">{delivery.destination}</DocumentItem>}
          {delivery.sent_at && <DocumentItem label="Enviado em">{formatDateTime(delivery.sent_at)}</DocumentItem>}
        </dl>
      )}
    </FormSection>
  );
}
