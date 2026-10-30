import { toast as sonner, type ExternalToast } from "sonner";

import { ErrorToast } from "@/components/ErrorToast";
import { takeErrorDetails } from "@/lib/error-details";

const ERROR_DURATION_MS = 6000;
const ERROR_WITH_DETAILS_DURATION_MS = 12000;

/**
 * O `toast` do sistema: o do Sonner, com o aviso de erro próprio (`ErrorToast`). Se a mensagem acabou de sair de `applyServerErrors` ou
 * `apiErrorMessage`, o aviso leva os detalhes do erro da API e pode ser aberto com um clique. Importe daqui, não de "sonner".
 */
export const toast = {
  success: sonner.success,
  info: sonner.info,
  warning: sonner.warning,
  dismiss: sonner.dismiss,
  error: (message: string, data?: ExternalToast) => {
    const details = takeErrorDetails(message);
    return sonner.custom((id) => <ErrorToast message={message} details={details} onClose={() => sonner.dismiss(id)} />, {
      duration: details ? ERROR_WITH_DETAILS_DURATION_MS : ERROR_DURATION_MS,
      ...data,
    });
  },
};
