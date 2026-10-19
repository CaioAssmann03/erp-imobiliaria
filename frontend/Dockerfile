# Dois alvos:
#   dev        -> usado pelo docker-compose (servidor de desenvolvimento com hot reload)
#   production -> último estágio, usado em produção na VPS (build de produção + `next start`)

FROM node:22-slim AS base
WORKDIR /app
# pnpm pinned like "packageManager" in package.json.
RUN npm install -g pnpm@12.6.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# ---- desenvolvimento ----
FROM base AS dev
RUN pnpm install
COPY . .
EXPOSE 3000
CMD ["pnpm", "dev"]

# ---- build de produção ----
FROM base AS build
# O navegador não conhece o endereço do Django (só o servidor do Next, em tempo de execução,
# por API_INTERNAL_URL): nada de NEXT_PUBLIC_* da API é embutido no build.
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# ---- produção (padrão: último estágio) ----
FROM base AS production
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
# Copia o app já construído (inclui node_modules: o next.config.ts precisa do TypeScript).
COPY --from=build /app ./
EXPOSE 3000
# Produção pode definir PORT; sem ela, 3000.
CMD ["sh", "-c", "pnpm start -p ${PORT:-3000}"]
