import type { Tokens } from "@/lib/auth/auth-cookies";

/** Endereço do Django para o servidor do Next (variável só do servidor, nunca vai ao navegador). */
export const API_URL = process.env.API_INTERNAL_URL || "http://localhost:8000";

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY ?? "";

/**
 * Cabeçalhos das chamadas do servidor do Next ao Django: o IP real do cliente (o Django só vê o
 * servidor do Next) acompanhado do segredo compartilhado, sem o qual o Django ignora o IP.
 */
export function backendHeaders(incoming: Headers): Headers {
  const headers = new Headers({ Accept: "application/json" });
  const clientIp = incoming.get("x-forwarded-for") ?? incoming.get("x-real-ip");
  if (clientIp && INTERNAL_API_KEY) {
    headers.set("X-Forwarded-For", clientIp);
    headers.set("X-Internal-Key", INTERNAL_API_KEY);
  }
  return headers;
}

async function requestRefresh(refresh: string, incoming: Headers): Promise<Tokens | null> {
  try {
    const headers = backendHeaders(incoming);
    headers.set("Content-Type", "application/json");
    const response = await fetch(`${API_URL}/api/auth/refresh/`, {
      method: "POST",
      headers,
      body: JSON.stringify({ refresh }),
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as Tokens;
  } catch {
    return null;
  }
}

// O refresh token gira a cada uso e o antigo é revogado. Várias requisições com o mesmo cookie
// vencido (a tela dispara várias de uma vez, e o navegador só troca o cookie ao receber a
// resposta) dividem UM refresh: o resultado fica guardado um instante para as que chegam depois.
const REFRESH_REUSE_WINDOW_MS = 30_000;
const recentRefreshes = new Map<string, { result: Promise<Tokens | null>; expiresAt: number }>();

export function refreshTokens(refresh: string, incoming: Headers): Promise<Tokens | null> {
  const now = Date.now();
  for (const [key, entry] of recentRefreshes) {
    if (entry.expiresAt < now) recentRefreshes.delete(key);
  }
  const existing = recentRefreshes.get(refresh);
  if (existing) return existing.result;

  const result = requestRefresh(refresh, incoming);
  recentRefreshes.set(refresh, { result, expiresAt: now + REFRESH_REUSE_WINDOW_MS });
  // Falha (rede, token inválido): não guarda, a próxima tentativa pode funcionar.
  void result.then((tokens) => {
    if (!tokens) recentRefreshes.delete(refresh);
  });
  return result;
}
