# Status Report da Sprint 1

## 1. Identificação

- **Projeto:** ERP Imobiliária (EVE Administradora de Imóveis)
- **Número da Sprint:** 1
- **Período:** 17/09 a 24/09/2026
- **Integrantes:** Gabriel Tadeu Matiolla, Caio assmann, Eduardo Paim, Raquel aguilhera
- **Scrum Master da Sprint:** 

### Meta da Sprint

**Meta:**

Levantar o sistema de referência (Sami ERP), modelar os dados e as regras de negócio do novo ERP, e definir a stack técnica do projeto.

---

## 2. Resultado da Sprint

### Situação da meta

- [ ] Alcançada
- [x] Parcialmente alcançada
- [ ] Não alcançada

### Resultado alcançado

**Resultado:**

O módulo de Condomínios foi totalmente levantado a partir de prints reais do Sami (cadastro de condomínio, blocos, unidades, pessoas, sub-contas e os menus de consulta/relatório/emissão) e modelado em detalhe. A emissão de boletos foi validada contra um boleto real do Santander, o que corrigiu duas suposições erradas do modelo inicial (destino do pagamento e separação de contas no extrato).

A stack técnica foi fechada: Django + Django REST Framework no backend, Next.js no frontend, PostgreSQL, Celery + Redis para jobs agendados, integração direta com a API do Santander para boleto/Pix, e hospedagem no Render (frontend, backend, banco, fila e worker).

Dois documentos vivos foram produzidos e estão publicados:
- **ERP Imobiliária — Arquitetura e Modelagem de Dados** — visão geral, módulos, modelo de dados completo, regras de negócio críticas e roadmap
- **Stack Técnica — ERP Imobiliária** — cada peça da stack, estrutura de pastas, fluxo de trabalho entre frontend e backend, e infraestrutura de deploy

Também foi produzida uma apresentação (8 slides) para demonstrar o funcionamento do novo sistema à equipe.

Os módulos de Financeiro, Locações, Vendas e Login/perfis de acesso foram modelados como **hipótese**, sem telas reais do Sami pra validar — ficam pendentes de confirmação.

### Principal dificuldade ou impedimento

**Dificuldade ou impedimento:**

Falta de prints reais das telas de Financeiro, Locações, Vendas e Login — sem esse material, esses módulos permanecem como hipótese e podem exigir retrabalho quando as telas reais forem enviadas.

---

## 3. Itens planejados e situação final

| User Story ou item | Responsável(is) | Situação final | Observação |
|---|---|---|---|
| Levantamento do Sami — módulo Condomínios | EQUIPE | Concluído | Cadastro, unidades, pessoas, sub-contas e menus mapeados |
| Modelagem de dados — Condomínios e Emissão de Boletos | EQUIPE| Concluído | Validado com prints reais e um boleto real do Santander |
| Modelagem de dados — Financeiro, Locações, Vendas, Login | EQUIPE| Em andamento | Modelado como hipótese, sem telas reais ainda |
| Definição da stack técnica | EQUIPE| Concluído | Django+DRF / Next.js / PostgreSQL / Celery+Redis / Render |
| Documento de arquitetura e modelagem de dados | EQUIPE| Concluído | Documento vivo, comentável |
| Documento de stack técnica | EQUIPE| Concluído | Documento vivo, comentável |
| Apresentação para a equipe (slides) | EQUIPE| Concluído | 8 slides |
| Roadmap do projeto (10 fases) | EQUIPE| Concluído | Registrado no documento de modelagem |
| Setup inicial do projeto (código) | — | Não iniciado | Depende da modelagem estar completa |

---

## 4. Evidências e qualidade

### Evidências

- **Repositório:** ainda não criado — nenhum código foi escrito nesta sprint
- **Quadro Kanban:** ainda não criado — conector do Trello não conectado
- **Deploy ou instruções para executar o projeto:** não aplicável ainda
- **Outras evidências:** os dois documentos vivos (Arquitetura e Modelagem de Dados; Stack Técnica) e a apresentação de slides

### Checklist de qualidade

- [x] Os itens marcados como concluídos foram revisados e confirmados por Caio (modelo de dados, stack, hospedagem)
- [ ] As funcionalidades entregues foram testadas pela equipe — não se aplica: sprint de descoberta e modelagem, sem código
- [x] Os documentos produzidos estão publicados e acessíveis
- [x] Os problemas conhecidos (telas faltantes, decisões pendentes) estão registrados no documento de modelagem

### Problemas conhecidos

**Registro:**

Telas de Financeiro, Locações, Vendas e Login ainda não foram enviadas. Duas decisões seguem em aberto: se o sistema nasce multiempresa desde o início, e se haverá migração de dados do Sami ou cadastro do zero. A regra de rateio para pagamento de boleto parcial ou a maior (diferente da soma dos itens) ainda não foi definida.

---

## 5. Retrospectiva da Sprint

### Manter

**Registro:**

Analisar prints reais antes de fechar o modelo trouxe precisão que a teoria sozinha não traria — o boleto real do Santander corrigiu uma suposição errada sobre como o dinheiro é roteado entre contas.

### Melhorar

**Registro:**

Sequenciar melhor o pedido dos prints das telas que faltam, para reduzir a quantidade de modelo construído como hipótese sem validação.

### Agir

**Ação:**

Priorizar o recebimento dos prints de Financeiro, Locações, Vendas e Login logo no início da próxima sprint, antes de avançar pro setup do projeto.

---

## 6. Planejamento da próxima Sprint

### Meta da próxima Sprint

**Meta:**

Completar ou confirmar a modelagem dos módulos restantes, resolver as decisões em aberto, e realizar o setup inicial do projeto (Fase 2 do roadmap: Django + Next.js + Docker rodando localmente).

### Itens inicialmente selecionados

| User Story ou item | Responsável(is), se definido(s) | Resultado esperado |
|---|---|---|
| Enviar prints de Financeiro, Locações, Vendas e Login | Caio | Modelo validado ou confirmado como hipótese aceita |
| Decidir multiempresa e migração de dados do Sami | EQUIPE| Decisão registrada no documento de modelagem |
| Setup do projeto (Django + Next.js + Docker) | EQUIPE | Ambiente rodando localmente |
| Iniciar credenciamento com o Santander | EQUIPE| Processo de credenciamento aberto junto ao banco |

> Esta é uma seleção inicial. O planejamento poderá ser ajustado no início da próxima sprint.

### Riscos ou impedimentos previstos

**Riscos:**

O credenciamento com o Santander depende de um prazo externo do banco — se não for iniciado logo, pode atrasar a Fase 5 do roadmap (Emissão de Boletos). Os módulos modelados como hipótese (Financeiro, Locações, Vendas) podem exigir retrabalho quando as telas reais chegarem.
