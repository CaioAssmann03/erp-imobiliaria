import axios from "axios";

import { ACCESS_COOKIE } from "./auth";

const isServer = typeof window === "undefined";

// Navegador: só a própria origem (`/api/...`, atendida pelo handler do Next, que guarda o token em
// cookie HttpOnly). Servidor (SSR): chama o Django direto, na rede interna, com o token do cookie.
const baseURL = isServer ? process.env.API_INTERNAL_URL || "http://localhost:8000" : "";

export const apiClient = axios.create({ baseURL });

apiClient.interceptors.request.use(async (config) => {
  if (isServer) {
    // Import dinâmico: `next/headers` só existe no servidor.
    const { cookies } = await import("next/headers");
    const token = (await cookies()).get(ACCESS_COOKIE)?.value;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // No servidor não dá para gravar cookies; o proxy.ts renova o token antes da renderização.
    if (isServer) return Promise.reject(error);
    // Login: um 401 aqui é "credenciais inválidas", não sessão expirada.
    if (String(error.config?.url ?? "").includes("/api/auth/")) return Promise.reject(error);
    if (error.response?.status === 401) {
      // O handler do Next já tentou renovar o token: a sessão acabou. Navegação completa (não
      // router.push): roda fora do React e garante que nenhum estado autenticado sobreviva.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
