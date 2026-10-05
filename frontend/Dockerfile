# Dois alvos:
#   dev        -> usado pelo docker-compose (servidor de desenvolvimento com hot reload)
#   production -> último estágio, usado pelo Render (build de produção + `next start`)

FROM node:22-slim AS base
WORKDIR /app
COPY package*.json ./

# ---- desenvolvimento ----
FROM base AS dev
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ---- build de produção ----
FROM base AS build
# O navegador não conhece o endereço do Django (só o servidor do Next, em tempo de execução,
# por API_INTERNAL_URL): nada de NEXT_PUBLIC_* da API é embutido no build.
RUN npm ci
COPY . .
RUN npm run build

# ---- produção (padrão: último estágio) ----
FROM node:22-slim AS production
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
# Copia o app já construído (inclui node_modules: o next.config.ts precisa do TypeScript).
COPY --from=build /app ./
EXPOSE 3000
# O Render define PORT; localmente cai em 3000.
CMD ["sh", "-c", "npm start -- -p ${PORT:-3000}"]
