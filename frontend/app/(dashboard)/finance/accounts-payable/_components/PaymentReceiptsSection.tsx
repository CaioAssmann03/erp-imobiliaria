"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";

import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { FormSection } from "@/components/form/FormSection";
import { Button } from "@/components/ui/button";
import {
  getPaymentReceiptsDownloadUrlQueryOptions,
  getPaymentReceiptsListQueryKey,
  useAccountsPayableReceiptsCreate,
  usePaymentReceiptsConfirm,
  usePaymentReceiptsDestroy,
  usePaymentReceiptsList,
} from "@/lib/api/generated";
import type { PaymentReceipt } from "@/lib/api/generated/models";
import { apiErrorMessage } from "@/lib/errors/form-errors";
import { formatDateTime, formatFileSize } from "@/lib/format/format";
import { RECEIPT_ACCEPT, receiptFileProblem, uploadToBucket } from "@/lib/finance/payment-receipts";
import { toast } from "@/lib/errors/toast";

function formatSentAt(iso: string) {
  return formatDateTime(iso);
}

/**
 * Comprovantes de uma conta paga. O arquivo vai do navegador direto ao bucket por uma URL assinada
 * (o Next só leva JSON): pede a URL, envia, e o backend confere o arquivo no bucket ao confirmar.
 */
export function PaymentReceiptsSection({ accountId }: { accountId: string }) {
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [isSending, setIsSending] = useState(false);

  const params = { account_payable: accountId };
  const { data, isLoading } = usePaymentReceiptsList(params);
  const createUpload = useAccountsPayableReceiptsCreate();
  const confirmReceipt = usePaymentReceiptsConfirm();
  const destroyReceipt = usePaymentReceiptsDestroy();
  const receipts = data?.results ?? [];

  const refresh = () => queryClient.invalidateQueries({ queryKey: getPaymentReceiptsListQueryKey(params) });

  const send = async (file: File) => {
    const problem = receiptFileProblem(file);
    if (problem) {
      toast.error(problem);
      return;
    }
    setIsSending(true);
    try {
      const upload = await createUpload.mutateAsync({
        id: accountId,
        data: { original_name: file.name, content_type: file.type, size_bytes: file.size },
      });
      await uploadToBucket(upload.upload_url, upload.upload_headers, file);
      await confirmReceipt.mutateAsync({ id: upload.id });
      await refresh();
      toast.success("Comprovante anexado.");
    } catch (error) {
      toast.error(apiErrorMessage(error, "Não foi possível anexar o comprovante. Tente novamente."));
    } finally {
      setIsSending(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const download = async (receipt: PaymentReceipt) => {
    try {
      // A URL assinada vale poucos minutos: sempre pede uma nova, nunca usa a do cache.
      const { download_url } = await queryClient.fetchQuery({
        ...getPaymentReceiptsDownloadUrlQueryOptions(receipt.id),
        staleTime: 0,
      });
      window.location.assign(download_url);
    } catch (error) {
      toast.error(apiErrorMessage(error, "Não foi possível baixar o comprovante."));
    }
  };

  const remove = (receipt: PaymentReceipt) =>
    destroyReceipt.mutate(
      { id: receipt.id },
      {
        onSuccess: async () => {
          await refresh();
          toast.success("Comprovante excluído.");
        },
        onError: (error) => toast.error(apiErrorMessage(error, "Não foi possível excluir o comprovante.")),
      }
    );

  return (
    <FormSection title="Comprovantes" description="PDF, JPEG ou PNG, até 10 MB cada.">
      {isLoading ? (
        <p className="text-body text-ink-soft">Carregando…</p>
      ) : receipts.length === 0 ? (
        <p className="text-body text-ink-soft">Nenhum comprovante anexado.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {receipts.map((receipt) => (
            <li
              key={receipt.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-panel bg-surface-muted px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-body">{receipt.original_name}</p>
                <p className="text-caption text-ink-soft tabular-nums">
                  {formatFileSize(receipt.size_bytes)} · {receipt.uploaded_by_name} · {formatSentAt(receipt.created_at)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => download(receipt)}>
                  Baixar
                </Button>
                <ConfirmDeleteButton
                  title="Excluir comprovante"
                  description={`${receipt.original_name} será removido da conta e do armazenamento.`}
                  onConfirm={() => remove(receipt)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
      <div>
        <input
          ref={fileInput}
          type="file"
          accept={RECEIPT_ACCEPT}
          className="sr-only"
          aria-label="Escolher arquivo do comprovante"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void send(file);
          }}
        />
        <Button type="button" variant="secondary" size="sm" disabled={isSending} onClick={() => fileInput.current?.click()}>
          {isSending ? "Enviando…" : "Anexar comprovante"}
        </Button>
      </div>
    </FormSection>
  );
}
