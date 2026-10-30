import axios from "axios";

// Só a própria origem (`/api/...`, atendida pelo handler do Next, que guarda o token em cookie HttpOnly
// e o renova): nenhuma página chama o Django a partir do servidor.
export const apiClient = axios.create({ baseURL: "" });

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
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
