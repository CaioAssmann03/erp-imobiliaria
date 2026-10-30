import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ACCESS_COOKIE, REFRESH_COOKIE } from "./lib/auth/auth";
import { clearAuthCookies, setAuthCookies } from "./lib/auth/auth-cookies";
import { refreshTokens } from "./lib/api/backend";
import { isTokenExpiring } from "./lib/auth/jwt";

const PUBLIC_PATHS = ["/login"];
// Páginas de apresentação do produto: abertas a todos, sem redirecionar quem já está logado.
const MARKETING_PATHS = ["/", "/features", "/how-it-works"];

function redirectToLogin(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const loginUrl = new URL("/login", request.url);
  if (pathname !== "/dashboard") loginUrl.searchParams.set("next", pathname);
  const response = NextResponse.redirect(loginUrl);
  clearAuthCookies(response);
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;

  if (MARKETING_PATHS.includes(pathname)) return NextResponse.next();

  if (isPublicPath) {
    return access
      ? NextResponse.redirect(new URL("/dashboard", request.url))
      : NextResponse.next();
  }

  if (!access && !refresh) return redirectToLogin(request);

  if (!access || isTokenExpiring(access)) {
    // Renova o access token antes de entregar a página: a sessão expirada cai no login aqui, e as chamadas
    // do navegador já começam com um token válido (o handler de /api também renova num 401).
    const tokens = refresh ? await refreshTokens(refresh, request.headers) : null;
    if (!tokens) return redirectToLogin(request);

    // Repassa os novos tokens para esta requisição...
    request.cookies.set(ACCESS_COOKIE, tokens.access);
    if (tokens.refresh) request.cookies.set(REFRESH_COOKIE, tokens.refresh);
    const response = NextResponse.next({ request: { headers: request.headers } });
    // ...e para o navegador (cookies HttpOnly).
    setAuthCookies(response, tokens);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|icon).*)",
  ],
};
