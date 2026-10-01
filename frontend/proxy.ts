import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ACCESS_COOKIE, REFRESH_COOKIE } from "./lib/auth";

const PUBLIC_PATHS = ["/login"];
const REFRESH_MARGIN_SECONDS = 30;

const API_URL =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000";

function isExpired(token: string): boolean {
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    return payload.exp - Date.now() / 1000 < REFRESH_MARGIN_SECONDS;
  } catch {
    return true;
  }
}

/**
 * Renova o access token antes da renderização, para que Server Components
 * consigam buscar dados com um token válido (eles não podem gravar cookies).
 */
async function refreshTokens(refresh: string) {
  try {
    const response = await fetch(`${API_URL}/api/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!response.ok) return null;
    return (await response.json()) as { access: string; refresh?: string };
  } catch {
    return null;
  }
}

function redirectToLogin(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const loginUrl = new URL("/login", request.url);
  if (pathname !== "/") loginUrl.searchParams.set("next", pathname);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;

  if (isPublicPath) {
    return access
      ? NextResponse.redirect(new URL("/", request.url))
      : NextResponse.next();
  }

  if (!access && !refresh) return redirectToLogin(request);

  if (!access || isExpired(access)) {
    const tokens = refresh ? await refreshTokens(refresh) : null;
    if (!tokens) return redirectToLogin(request);

    // Repassa os novos tokens para os Server Components desta requisição...
    request.cookies.set(ACCESS_COOKIE, tokens.access);
    if (tokens.refresh) request.cookies.set(REFRESH_COOKIE, tokens.refresh);
    const response = NextResponse.next({ request: { headers: request.headers } });
    // ...e para o navegador.
    response.cookies.set(ACCESS_COOKIE, tokens.access, { path: "/", maxAge: 86400, sameSite: "lax" });
    if (tokens.refresh) {
      response.cookies.set(REFRESH_COOKIE, tokens.refresh, { path: "/", maxAge: 7 * 86400, sameSite: "lax" });
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
