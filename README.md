# ERP Imobiliária

Sistema de ERP para administradora de condomínios, locações, vendas e financeiro.

Documentação completa:
- [Arquitetura e Modelagem de Dados](https://claude.ai/code/artifact/b8a13ffb-f93f-4765-b54c-fe3d5e1496a8)
- [Stack Técnica](https://claude.ai/code/artifact/bf998f82-25a4-426f-8ab5-dcdd4b71e7d0)
- [Sprints](https://claude.ai/code/artifact/a3ec7ec2-eebb-402f-a6ac-aecde0b77ccb)
- [Quadro Trello](https://trello.com/b/DSNUcHd1/erp-imobili%C3%A1ria)

## Stack

- **Backend:** Django + Django REST Framework + PostgreSQL
- **Frontend:** Next.js + TypeScript + Tailwind + TanStack Query
- **Jobs:** Celery + Redis
- **Deploy:** VPS com Docker Compose e HTTPS pelo Caddy (ver *Deploy na VPS*)

## Rodando localmente

Pré-requisitos: Docker Desktop (com `docker compose`) e Git.

```bash
git clone https://github.com/CaioAssmann03/erp-imobiliaria.git
cd erp-imobiliaria
git checkout dev                 # a branch com tudo junto, para testar antes da main
cp .env.example .env
```

Duas chaves são obrigatórias e vêm com `change-me` no `.env`; gere as duas sem instalar nada (só Docker) e cole no `.env`:

```bash
# JWT_SIGNING_KEY (uma linha, com \n literal)
docker run --rm python:3.12-slim sh -c "pip install -q cryptography >/dev/null 2>&1 && python -c \"from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey as K; from cryptography.hazmat.primitives import serialization as s; print(K.generate().private_bytes(s.Encoding.PEM, s.PrivateFormat.PKCS8, s.NoEncryption()).decode().strip().replace(chr(10), chr(92) + 'n'))\""

# GATEWAY_CREDENTIALS_KEY
docker run --rm python:3.12-slim sh -c "pip install -q cryptography >/dev/null 2>&1 && python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
```

Depois:

```bash
docker compose up -d --build
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser   # usuário e senha para entrar
docker compose exec backend python manage.py seed_demo         # dados FICTÍCIOS de exemplo (--clear remove)
```

- Frontend: http://localhost:3000 (entre com o usuário criado acima)
- API: http://localhost:8000/api/docs/ · Admin: http://localhost:8000/admin/
- Arquivos (PDF do boleto, comprovantes): o `docker compose` já sobe um MinIO local (console em http://localhost:9001, usuário e senha `minioadmin`) e cria o bucket `erp-dev`; assim "Baixar PDF" funciona no notebook. Sem ele o PDF responde 503.
- Porta 5432 ocupada? Ponha `POSTGRES_HOST_PORT=5434` no `.env` e rode `docker compose up -d` de novo.
- Parar: `docker compose down` (os dados ficam); apagar tudo: `docker compose down -v`.
- Só dados de exemplo no seu notebook: **nunca** coloque dados reais de clientes nele.

## Deploy na VPS

Produção roda numa VPS com Docker Compose: Postgres, Redis, backend (gunicorn), Celery e frontend. O
HTTPS vem do Caddy que já existe na VPS (um bloco no `Caddyfile` aponta o domínio para o frontend), e o
nome provisório é `erp.177-7-63-175.sslip.io`. Os comprovantes de pagamento ficam num bucket Cloudflare R2
(variáveis `AWS_*`; sem elas só a parte de comprovantes fica indisponível). O passo a passo, as variáveis e o
que fazer quando algo falha estão em [`backend/docs/architecture/operations.md`](backend/docs/architecture/operations.md)
(seção *Production on the VPS*). O compose de produção e o `deploy.sh` estão versionados em [`deploy/vps/`](deploy/vps/README.md).

## Client da API no frontend

O frontend não chama a API manualmente: os hooks React Query em `frontend/lib/api/generated/` são gerados a partir do schema OpenAPI do backend pelo [orval](https://orval.dev). Sempre que um endpoint for criado/alterado no backend, regenere o client com o backend rodando:

```bash
cd frontend
pnpm generate:api
```

## Estrutura

```
backend/    # Django + DRF
frontend/   # Next.js
```

## Fluxo de branches

Uma branch por task (`feature/<nome-da-task>`), Pull Request pra `main`, CI roda os testes automaticamente. Veja o documento de Stack Técnica para o fluxo completo de revisão.
