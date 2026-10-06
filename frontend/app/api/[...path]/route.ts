import { NextResponse, type NextRequest } from "next/server";

import { errorResponse } from "@/lib/api-error";
import { clearAuthCookies, setAuthCookies, type Tokens } from "@/lib/auth-cookies";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth";
import { API_URL, backendHeaders, refreshTokens } from "@/lib/backend";
import { isTokenExpiring } from "@/lib/jwt";

/**
 * O navegador só fala com este servidor (`/api/...`, mesma origem). Aqui o token vive em cookie
 * HttpOnly: o handler o lê, chama o Django com `Authorization: Bearer` e devolve status e JSON
 * sem alterar. Login e logout também passam por aqui (o navegador nunca vê um token).
 * Só JSON; arquivos grandes não passam por aqui (limite da plataforma): usarão URL assinada.
 */

type Context = { params: Promise<{ path: string[] }> };

const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

/** A origem pública deste servidor, como o navegador a vê (atrás de proxy vale o cabeçalho do proxy). */
function ownOrigin(request: NextRequest): string {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? request.nextUrl.host;
  const protocol = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
  return `${protocol}://${host}`;
}

/** Mutação vinda de outra origem é bloqueada (além do SameSite=Lax dos cookies). */
function isCrossOrigin(request: NextRequest): boolean {
  if (SAFE_METHODS.includes(request.method)) return false;
  const origin = request.headers.get("origin");
  if (origin) return origin !== ownOrigin(request);
  const fetchSite = request.headers.get("sec-fetch-site");
  return fetchSite !== null && fetchSite !== "same-origin" && fetchSite !== "none";
}

async function callBackend(
  request: NextRequest,
  route: string,
  body: ArrayBuffer | undefined,
  access: string | undefined
): Promise<Response> {
  const headers = backendHeaders(request.headers);
  if (body) headers.set("Content-Type", "application/json");
  if (access) headers.set("Authorization", `Bearer ${access}`);
  return fetch(`${API_URL}/api/${route}/${request.nextUrl.search}`, {
    method: request.method,
    headers,
    body,
    cache: "no-store",
    redirect: "manual",
  });
}

/** Devolve status e corpo do Django como vieram (só o tipo do conteúdo é repassado). */
async function relay(upstream: Response): Promise<NextResponse> {
  const body = upstream.status === 204 || upstream.status === 304 ? null : await upstream.arrayBuffer();
  const headers = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  return new NextResponse(body, { status: upstream.status, headers });
}

function unavailable(): NextResponse {
  return errorResponse(502, "bad_gateway", "The server is unavailable.");
}

function sessionEnded(): NextResponse {
  const response = errorResponse(401, "not_authenticated", "The session ended. Sign in again.");
  clearAuthCookies(response);
  return response;
}

async function login(request: NextRequest): Promise<NextResponse> {
  const body = await request.arrayBuffer();
  let upstream: Response;
  try {
    upstream = await callBackend(request, "auth/login", body, undefined);
  } catch {
    return unavailable();
  }
  if (!upstream.ok) return relay(upstream);

  const tokens = (await upstream.json()) as Tokens;
  const response = new NextResponse(null, { status: 204 });
  setAuthCookies(response, tokens); // os tokens vão só nos cookies HttpOnly, nunca no corpo
  return response;
}

async function logout(request: NextRequest): Promise<NextResponse> {
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  if (refresh) {
    try {
      const headers = backendHeaders(request.headers);
      headers.set("Content-Type", "application/json");
      await fetch(`${API_URL}/api/auth/logout/`, {
        method: "POST",
        headers,
        body: JSON.stringify({ refresh }),
        cache: "no-store",
      });
    } catch {
      // O backend indisponível não impede sair: os cookies somem de qualquer forma.
    }
  }
  const response = new NextResponse(null, { status: 204 });
  clearAuthCookies(response);
  return response;
}

async function proxyJson(request: NextRequest, route: string): Promise<NextResponse> {
  let body: ArrayBuffer | undefined;
  if (!["GET", "HEAD"].includes(request.method)) {
    const raw = await request.arrayBuffer();
    const isJson = (request.headers.get("content-type") ?? "").includes("application/json");
    if (raw.byteLength > 0 && !isJson) {
      return errorResponse(415, "unsupported_media_type", "Only JSON is accepted.");
    }
    body = raw.byteLength > 0 ? raw : undefined;
  }

  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  let access = request.cookies.get(ACCESS_COOKIE)?.value;
  let renewed: Tokens | null = null;

  if (refresh && (!access || isTokenExpiring(access))) {
    renewed = await refreshTokens(refresh, request.headers);
    if (!renewed) return sessionEnded();
    access = renewed.access;
  }

  let upstream: Response;
  try {
    upstream = await callBackend(request, route, body, access);
    if (upstream.status === 401 && refresh && !renewed) {
      // O access token foi recusado antes de vencer: uma renovação e uma nova tentativa.
      renewed = await refreshTokens(refresh, request.headers);
      if (!renewed) return sessionEnded();
      upstream = await callBackend(request, route, body, renewed.access);
    }
  } catch {
    return unavailable();
  }

  const response = await relay(upstream);
  if (renewed) setAuthCookies(response, renewed);
  return response;
}

async function handle(request: NextRequest, context: Context): Promise<NextResponse> {
  const route = (await context.params).path.join("/");
  if (isCrossOrigin(request)) {
    return errorResponse(403, "permission_denied", "Cross-origin request blocked.");
  }
  if (route === "auth/refresh") return errorResponse(404, "not_found", "Not found.");
  if (route === "auth/login" && request.method === "POST") return login(request);
  if (route === "auth/logout" && request.method === "POST") return logout(request);
  return proxyJson(request, route);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
