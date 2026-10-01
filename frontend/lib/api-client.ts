import axios from "axios";

import { getCookie, removeCookie, setCookie } from "./cookies";

import { ACCESS_COOKIE, REFRESH_COOKIE } from "./auth";

export { ACCESS_COOKIE, REFRESH_COOKIE };

const isServer = typeof window === "undefined";
const publicURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
// No servidor (SSR) o backend é alcançado pela rede interna do Docker.
const baseURL = isServer ? process.env.API_INTERNAL_URL || publicURL : publicURL;

export const apiClient = axios.create({ baseURL });

async function readAccessToken(): Promise<string | undefined> {
  if (isServer) {
    // Import dinâmico: `next/headers` só existe no servidor.
    const { cookies } = await import("next/headers");
    return (await cookies()).get(ACCESS_COOKIE)?.value;
  }
  return getCookie(ACCESS_COOKIE);
}

apiClient.interceptors.request.use(async (config) => {
  const token = await readAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getCookie(REFRESH_COOKIE);
  if (!refresh) return null;

  const { data } = await axios.post(`${baseURL}/api/auth/refresh/`, { refresh });
  setCookie(ACCESS_COOKIE, data.access, 1);
  if (data.refresh) setCookie(REFRESH_COOKIE, data.refresh, 7);
  return data.access as string;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    // No servidor não dá para gravar cookies; o proxy.ts renova o token antes
    // da renderização e o cliente refaz a requisição se ainda falhar.
    if (isServer) return Promise.reject(error);
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        refreshing = refreshing || refreshAccessToken();
        const newAccess = await refreshing;
        refreshing = null;
        if (newAccess) {
          original.headers.Authorization = `Bearer ${newAccess}`;
          return apiClient(original);
        }
      } catch {
        // refresh failed — fall through to logout below
      }
      removeCookie(ACCESS_COOKIE);
      removeCookie(REFRESH_COOKIE);
      if (typeof window !== "undefined") {
        // Hard navigation (not router.push): this runs outside React, and a full
        // reload guarantees no stale authenticated state (query cache, component
        // state) survives the redirect.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
