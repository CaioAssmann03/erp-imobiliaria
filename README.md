<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/assets/logo-metri-white.svg">
    <img src="docs/assets/logo-metri.svg" alt="METRI" width="260">
  </picture>
</p>

<p align="center"><strong>ERP para administradoras de condomínios.</strong><br>Cadastros, cobrança e financeiro em um só sistema.</p>

---

## O que é

O METRI é a ferramenta interna de uma administradora de condomínios: a equipe cadastra condomínios, unidades e pessoas, emite os boletos do mês e acompanha o caixa de cada condomínio. Hoje só usuários administradores entram; o portal para proprietários e inquilinos está planejado.

**Já funciona**

- **Cadastros:** condomínios (dados, endereço, taxa, regras de cobrança, rateio), blocos, unidades com proprietário e inquilino, sub-contas e pessoas (CPF e CNPJ).
- **Cobrança:** planos, lançamentos avulsos (*Inclusão de valores*), emissão mensal de boletos em lote com PDF rascunho e a taxa de cadastro da administradora.
- **Financeiro:** contas a pagar com baixa, extrato por condomínio e por sub-conta, lançamento manual com estorno e a conta da própria administradora.
- **Painel:** resumo, pendências, vencimentos e busca global.

**Em andamento:** integração bancária com o Asaas (boleto registrado e baixa automática). **Planejado:** portal do cliente, locações e vendas.

## Tecnologia

| | |
|---|---|
| Backend | Django + Django REST Framework + PostgreSQL |
| Frontend | Next.js (App Router) + TypeScript + Tailwind + TanStack Query |
| Jobs | Celery + Redis |
| Produção | VPS com Docker Compose e HTTPS pelo Caddy |

O frontend usa um client gerado a partir do schema OpenAPI do backend: a API é o contrato.

## Rodando localmente

Precisa de Docker Desktop e Git.

```bash
git clone https://github.com/CaioAssmann03/erp-imobiliaria.git
cd erp-imobiliaria
cp .env.example .env          # preencha as duas chaves (abaixo)
docker compose up -d --build
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
docker compose exec backend python manage.py seed_demo    # dados FICTÍCIOS (--clear remove)
```

- Frontend: http://localhost:3000 · API: http://localhost:8000/api/docs/ · Admin: http://localhost:8000/admin/
- No Windows, `scripts/local-up.ps1` faz tudo de uma vez (chaves, containers, migrate, usuário e exemplos).
- Porta 5432 ocupada? Defina `POSTGRES_HOST_PORT=5434` no `.env`.
- Use só dados de exemplo no notebook: **nunca** dados reais de clientes.

<details>
<summary>Gerando as duas chaves obrigatórias do <code>.env</code></summary>

`JWT_SIGNING_KEY` e `GATEWAY_CREDENTIALS_KEY` vêm com `change-me`. Gere as duas só com Docker:

```bash
# JWT_SIGNING_KEY (uma linha, com \n literal)
docker run --rm python:3.12-slim sh -c "pip install -q cryptography >/dev/null 2>&1 && python -c \"from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey as K; from cryptography.hazmat.primitives import serialization as s; print(K.generate().private_bytes(s.Encoding.PEM, s.PrivateFormat.PKCS8, s.NoEncryption()).decode().strip().replace(chr(10), chr(92) + 'n'))\""

# GATEWAY_CREDENTIALS_KEY
docker run --rm python:3.12-slim sh -c "pip install -q cryptography >/dev/null 2>&1 && python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
```

</details>

## Estrutura e documentação

```
backend/    Django + DRF   → backend/AGENTS.md (índice de docs, specs e roadmap)
frontend/   Next.js        → frontend/AGENTS.md (índice de docs)
```

- **Onde o projeto está:** [`backend/docs/roadmap/current-state.md`](backend/docs/roadmap/current-state.md)
- **Como a administradora funciona:** [`backend/docs/architecture/business-model.md`](backend/docs/architecture/business-model.md)
- **Deploy e operação na VPS:** [`backend/docs/architecture/operations.md`](backend/docs/architecture/operations.md)
- **Quadro de tarefas:** [Trello](https://trello.com/b/DSNUcHd1/erp-imobili%C3%A1ria)

Depois de alterar a API, regenere o client do frontend (com o backend rodando): `cd frontend && pnpm generate:api`.

## Fluxo de trabalho

Uma branch por tarefa, Pull Request para `main` e CI rodando os testes do backend e do frontend.
