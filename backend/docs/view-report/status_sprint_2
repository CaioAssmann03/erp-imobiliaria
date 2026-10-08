# Status Report da Sprint 2 — ERP Imobiliária

## 1. Identificação

- **Projeto:** ERP Imobiliária (EVE Administradora de Imóveis)
- **Número da Sprint:** 2
- **Período:** 25/09 a 08/10/2026
- **Integrantes:** Gabriel Tadeu Matiolla, Caio Assmann, Eduardo Paim, Raquel Aguilhera
- **Scrum Master da Sprint:**

### Meta da Sprint

Colocar o projeto de pé e entregar a primeira versão funcional do módulo Financeiro — cadastro de contas a pagar, lançamento manual na conta do condomínio e consulta de extrato — com alertas de vencimento no painel inicial.

## 2. Resultado da Sprint

### Situação da meta

- [x] Alcançada
- [ ] Parcialmente alcançada
- [ ] Não alcançada

### Resultado alcançado

A Sprint 2 marcou a passagem da modelagem para o código: o primeiro módulo do ERP está funcionando. O módulo **Financeiro** foi entregue com três funcionalidades:

- **Cadastro de contas a pagar** — registro das despesas do condomínio com valor, vencimento e situação
- **Lançamento manual na conta do condomínio** — entradas e saídas avulsas que não vêm de boleto, mantendo o saldo correto
- **Consulta de extratos** — visualização das movimentações da conta do condomínio por período

O **painel inicial** ganhou um card de vencimentos, que dá visão imediata do que precisa de atenção:

- Contas **vencidas**
- Contas que **vencem hoje**
- Contas que vencem **nos próximos 7 dias**
- **Próximos vencimentos** em geral

Com isso, o sistema já cobre o ciclo básico de controle de despesas do condomínio, do cadastro ao acompanhamento.

### Principal dificuldade ou impedimento

O Financeiro foi construído sobre um modelo que, na Sprint 1, ainda era hipótese. Se as telas reais do Sami mostrarem campos ou regras diferentes, parte do módulo pode precisar de ajuste.

## 3. Itens planejados e situação final

| User Story ou item | Responsável(is) | Situação final | Observação |
| --- | --- | --- | --- |
| Setup do projeto (Django + Next.js + Docker) | EQUIPE | Concluído | Base sobre a qual o módulo Financeiro foi construído |
| Cadastro de contas a pagar | EQUIPE | Concluído | Valor, vencimento e situação da conta |
| Lançamento manual na conta do condomínio | EQUIPE | Concluído | Entradas e saídas avulsas fora do fluxo de boleto |
| Consulta de extratos | EQUIPE | Concluído | Movimentações da conta do condomínio por período |
| Card de vencimentos no painel inicial | EQUIPE | Concluído | Vencidas, vencem hoje, próximos 7 dias e próximos vencimentos |
| Enviar prints de Financeiro, Locações, Vendas e Login | Caio | A confirmar | Necessário para validar o modelo do Financeiro já implementado |
| Decidir multiempresa e migração de dados do Sami | EQUIPE | A confirmar | Impacta a estrutura do banco; ideal decidir antes do próximo módulo |
| Iniciar credenciamento com o Santander | EQUIPE | A confirmar | Prazo externo; bloqueia a Fase 5 (Emissão de Boletos) |

## 4. Evidências e qualidade

### Evidências

- **Repositório:** https://github.com/CaioAssmann03/erp-imobiliaria.git
- **Quadro Kanban:** https://trello.com/b/DSNUcHd1/erp-imobiliaria
- **Deploy ou instruções para executar o projeto:** https://erp.177-7-63-175.sslip.io/
- **Outras evidências:** prints ou vídeo curto do cadastro de contas a pagar, lançamento manual, extrato e card de vencimentos

### Checklist de qualidade

- [x] Os itens marcados como concluídos foram revisados pela equipe
- [x] As funcionalidades entregues foram testadas pela equipe — confirmar se houve teste dos cenários de vencimento (hoje, vencida, 7 dias)
- [x] O código está versionado no repositório com as alterações da sprint
- [x] Os problemas conhecidos estão registrados abaixo

### Problemas conhecidos

- O módulo Financeiro segue um modelo ainda não validado com as telas reais do Sami.
- O card de vencimentos depende da data do servidor; é preciso garantir o fuso de Brasília (UTC-3) para que "vence hoje" não vire "vencida" à noite.
- Seguem em aberto: sistema multiempresa ou não, migração de dados do Sami e regra de rateio para pagamento parcial ou a maior.

## 5. Retrospectiva da Sprint

### Manter

Entregar funcionalidade de ponta a ponta: o card de vencimentos no painel transformou os cadastros do Financeiro em algo que o usuário enxerga e usa no dia a dia.

### Melhorar

O Financeiro avançou antes de o modelo ser validado com as telas reais. Validar antes de codificar reduz o risco de retrabalho nos próximos módulos.

### Agir

No início da Sprint 3, comparar o Financeiro implementado com as telas reais do Sami e registrar as diferenças antes de iniciar um novo módulo.

## 6. Planejamento da próxima Sprint

### Meta da próxima Sprint

Validar o módulo Financeiro com as telas reais do Sami, fechar as decisões estruturais em aberto e avançar o Financeiro para contas a receber e baixa de pagamentos.

### Itens inicialmente selecionados

| User Story ou item | Responsável(is), se definido(s) | Resultado esperado |
| --- | --- | --- |
| Validar o Financeiro com as telas reais do Sami | EQUIPE | Diferenças registradas e ajustes priorizados |
| Decidir multiempresa e migração de dados do Sami | EQUIPE | Decisão registrada no documento de modelagem |
| Baixa de contas a pagar (marcar como paga) | EQUIPE | Conta sai dos alertas e entra no extrato |
| Contas a receber do condomínio | EQUIPE | Cadastro e consulta de receitas |
| Testes dos cenários de vencimento | EQUIPE | Card validado para vencidas, hoje e próximos 7 dias |
| Iniciar credenciamento com o Santander | EQUIPE | Processo aberto junto ao banco |

> Esta é uma seleção inicial. O planejamento poderá ser ajustado no início da próxima sprint.

### Riscos ou impedimentos previstos

O credenciamento com o Santander tem prazo externo; cada sprint sem iniciá-lo empurra a Fase 5 (Emissão de Boletos). Sem a decisão sobre multiempresa, novos módulos podem exigir mudança na estrutura do banco.
