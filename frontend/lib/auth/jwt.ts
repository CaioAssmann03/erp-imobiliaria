/** Segundos antes de expirar em que o access token já conta como vencido (renova antes de usar). */
export const REFRESH_MARGIN_SECONDS = 30;

/** Lê só o `exp` do JWT (sem validar assinatura: quem valida é o backend). Token ilegível = vencido. */
export function isTokenExpiring(token: string, marginSeconds = REFRESH_MARGIN_SECONDS): boolean {
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    return payload.exp - Date.now() / 1000 < marginSeconds;
  } catch {
    return true;
  }
}
