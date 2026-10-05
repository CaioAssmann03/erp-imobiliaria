import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A API do Django exige a barra final (`/api/condominiums/`): sem isso o Next redirecionaria
  // toda chamada do navegador para a versão sem barra, e o handler de `/api/[...path]` já a normaliza.
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
