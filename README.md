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
- **Deploy:** Render

## Rodando localmente

Pré-requisitos: Docker Desktop.

```bash
cp .env.example .env
docker-compose up -d
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
```

- API: http://localhost:8000/api/docs/
- Admin: http://localhost:8000/admin/
- Frontend: http://localhost:3000 (login com o usuário criado acima)

## Client da API no frontend

O frontend não chama a API manualmente: os hooks React Query em `frontend/lib/api/generated/` são gerados a partir do schema OpenAPI do backend pelo [orval](https://orval.dev). Sempre que um endpoint for criado/alterado no backend, regenere o client com o backend rodando:

```bash
cd frontend
npx orval
```

## Estrutura

```
backend/    # Django + DRF
frontend/   # Next.js
```

## Fluxo de branches

Uma branch por task (`feature/<nome-da-task>`), Pull Request pra `main`, CI roda os testes automaticamente. Veja o documento de Stack Técnica para o fluxo completo de revisão.
