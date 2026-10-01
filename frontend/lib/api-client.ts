import axios from "axios";

import { getCookie, removeCookie, setCookie } from "./cookies";

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const apiClient = axios.create({ baseURL });

apiClient.interceptors.request.use((config) => {
  const token = getCookie(ACCESS_COOKIE);
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
  return data.access as string;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
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
