/**
 * Uma taxa de juros que ainda não foi salva: no condomínio novo as taxas são escolhidas antes de ele existir e só são gravadas depois dele (o condomínio
 * vai primeiro; a taxa precisa do id dele). `monthly_percentage` já vem no formato da API ("1.00").
 */
export interface PendingInterestRate {
  key: string;
  start_date: string;
  monthly_percentage: string;
}

let counter = 0;
export const newPendingRateKey = () => `pending-rate-${++counter}`;
