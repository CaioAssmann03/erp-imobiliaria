import type { NextResponse } from "next/server";

import { ACCESS_COOKIE, REFRESH_COOKIE } from "./auth";

/** O access token dura 30 min no backend: o cookie expira junto. */
export const ACCESS_MAX_AGE_SECONDS = 30 * 60;
export const REFRESH_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export interface Tokens {
  access: string;
  refresh?: string;
}

function options(maxAge: number) {
  return {
    httpOnly: true, // o JavaScript do navegador nunca lê o token
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

/** Grava os tokens em cookies HttpOnly. Só roda no servidor (handlers e proxy.ts). */
export function setAuthCookies(response: NextResponse, tokens: Tokens): void {
  response.cookies.set(ACCESS_COOKIE, tokens.access, options(ACCESS_MAX_AGE_SECONDS));
  if (tokens.refresh) {
    response.cookies.set(REFRESH_COOKIE, tokens.refresh, options(REFRESH_MAX_AGE_SECONDS));
  }
}

export function clearAuthCookies(response: NextResponse): void {
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
}
