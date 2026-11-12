---
summary: Status report of the sprint that started on 2026-10-23 (data up to 2026-11-12), in Portuguese: goal, result, planned items, quality, retrospective and next sprint.
read-when: you need what the team reported so far for the sprint that started on 2026-10-23 (it counts calendar sprints, not the roadmap phases)
skip-if: you need what is done or comes next in the project → roadmap/README.md; the previous sprint → view-report/status_sprint_2.md
---
# Status Report da Sprint 3 — ERP Imobiliária

## 1. Identificação

- **Projeto:** ERP Imobiliária
- **Número da Sprint:** 3 (parcial: dados até 12/11)
- **Período:** 23/10 a 12/11/2026 (relatório parcial, até 12/11)
- **Integrantes:** Gabriel Tadeu Matiolla, Caio Assmann, Eduardo Paim, Raquel Aguilhera
- **Scrum Master da Sprint:**

### Meta da Sprint

Fechar o fluxo de cobrança do condomínio — tarifa de registro, Inclusão de valores, boleto extra e descontos —, entregar os relatórios (Inadimplência, Prestação de contas, Taxa de administração e Ficha da unidade), renovar a interface do ERP e deixar o sistema seguro e rápido o bastante para dados reais.

## 2. Resultado da Sprint

### Situação da meta

- [ ] Alcançada
- [x] Parcialmente alcançada
- [ ] Não alcançada

### Resultado alcançado

O fluxo de cobrança e os quatro relatórios ficaram completos no código, a interface foi refeita e o sistema ganhou segurança e desempenho. Entregas até 12/11:

**Cobrança e financeiro**
- **Boleto extra** — boleto avulso, fora da emissão do mês, para uma ou mais unidades, com vencimento próprio e tarifa de registro opcional; a tela mostra os boletos emitidos e as unidades que ficaram de fora, com o motivo
- **Descontos** — valores negativos na Inclusão de valores e no boleto extra; o total nunca fica abaixo da tarifa de registro e a tarifa nunca recebe desconto; o desconto pago vira débito na sub-conta
- **Inclusão de valores e tarifa de registro** — lançamentos individuais, coletivos ou por fração entram no boleto do mês; a tarifa de R$ 3,90 é crédito da imobiliária e nunca do condomínio
- **Conta única do Asaas por empresa** — no lugar de uma subconta por condomínio
- **Catálogo único de sub-contas da administradora** — código e nome definidos uma vez; cada condomínio usa as que quiser
- **Backup** criptografado do banco, toda noite, para um bucket privado (código pronto, falta ativar na VPS)

**Relatórios** (todos na tela e em PDF)
- **Inadimplência** — agora por unidade: abre resumida, com os meses em aberto só quando se pede; filtra por condomínio, unidade e mês, e o PDF pode incluir os meses
- **Prestação de contas** e **Resumo mensal de boletos** no painel, com paginação
- **Taxa de administração** — o que a administradora tem a cobrar de cada condomínio no mês, pelo contrato e pelo extrato
- **Ficha da unidade** — dados e pessoas, boletos com situação e lançamentos do extrato, por período

**Interface**
- Menu lateral com modal por módulo, cadastro de condomínios e de unidades por condomínio, relatórios em moldura própria, telas de cobrança em 3 colunas, seletores com busca e criação rápida, modo leve para computadores fracos
- Versão para celular do painel e das páginas públicas; site público redesenhado, com SEO e contato
- **Assistente de ajuda** em painel lateral (em andamento): responde só com textos de ajuda e recusa perguntas com dados pessoais

**Segurança, dados e desempenho**
- **Arquivamento em vez de exclusão** de condomínios, blocos, unidades, pessoas, fornecedores e sub-contas, com página de Arquivados no Admin e anonimização de pessoas (LGPD)
- **Reforço de segurança** a partir de uma revisão: documentação da API fechada, bloqueio após tentativas erradas, limite de requisições, validação dos comprovantes, auditoria das dependências, container sem root, e toda requisição filtrada pela empresa do usuário (sem exceção para superusuário)
- **Filtros, buscas e ordenação no servidor**, nunca no navegador
- **Desempenho** medido com cerca de 55 mil unidades e 330 mil boletos: índices e consultas corrigidos, cache do painel, paginação mais rápida e servidor com mais processos

**Arquitetura**
- Módulos de pessoa em uma só tabela, peças compartilhadas em `core`, critérios de rateio nomeados; `dev` e `main` reconciliadas e no mesmo commit; checagem de tipos (mypy) limpa de novo

### Principal dificuldade ou impedimento

O que foi feito ainda não foi usado com dados reais: o Asaas não foi testado em sandbox (adiado) e o backup ainda não rodou na VPS.

## 3. Itens planejados e situação final

| User Story ou item | Responsável(is) | Situação final | Observação |
| --- | --- | --- | --- |
| Boleto extra (spec 054) | Caio | Concluído | API e tela; aguarda confirmação de decisões |
| Descontos — valores negativos (spec 055) | Caio | Concluído | Total não pode ficar abaixo da tarifa; desconto pago vira débito |
| Inclusão de valores e tarifa de registro (specs 038 e 039) | Caio | Concluído | Em uso apenas em ambiente de teste |
| Conta única do Asaas por empresa (spec 037) | Caio | Concluído | Falta validar em sandbox |
| Catálogo de sub-contas da administradora (spec 053) | Caio | Concluído | Migração dos dados antigos testada em banco de exemplo |
| Relatórios de Inadimplência e Prestação de contas (spec 052) | Caio | Concluído | Paginação e ordenação feitas pelo Eduardo |
| Taxa de administração e Ficha da unidade (specs 070 e 071) | Caio | Concluído | Tela e PDF; a taxa é só relatório, não lança nada |
| Inadimplência por unidade, meses sob demanda (spec 072) | Caio | Concluído | Filtro de unidade e PDF com opção de meses |
| Backup criptografado do banco (spec 040) | Caio | Em andamento | Código pronto; falta bucket, senha, publicação e teste de restauração |
| Nova interface: menu, cadastros, relatórios, cobrança em 3 colunas, modo leve | Caio e Eduardo | Concluído | `dev` e `main` no mesmo commit |
| Celular, site público e login novos | Eduardo | Concluído | Redesenho com SEO e contato |
| Arquivamento e página de Arquivados (specs 062 e 063) | Eduardo | Concluído | Exclusão vira arquivamento; LGPD |
| Reforço de segurança (specs 065 e 067) | Eduardo | Concluído | Inclui escopo por empresa sem exceção de superusuário |
| Filtros e ordenação no servidor (specs 064, 066 e 068) | Eduardo | Concluído | Telas não filtram mais no navegador |
| Desempenho com dados em volume | Eduardo | Concluído | 55 mil unidades e 330 mil boletos |
| Assistente de ajuda (spec 069) | Eduardo | Em andamento | Responde com textos curados; sem acesso ao banco |
| Correção da checagem de tipos (mypy) | Caio | Concluído | `main` voltou a passar sem erros |
| Validar o Financeiro com as telas reais do Sami | EQUIPE | A confirmar | Pendente desde a Sprint 2 |
| Teste do Asaas em sandbox | EQUIPE | Não iniciado | Adiado pelo cliente; as outras regras de negócio vieram antes |

## 4. Evidências e qualidade

### Evidências

- **Repositório:** https://github.com/CaioAssmann03/erp-imobiliaria.git
- **Quadro Kanban:** https://trello.com/b/DSNUcHd1/erp-imobiliaria
- **Deploy ou instruções para executar o projeto:** https://erp.177-7-63-175.sslip.io/
- **Outras evidências:** commits na `main` e na `dev` (PRs do Eduardo até o #78); prints das telas Boleto extra, lançamento com desconto, Taxa de administração, Ficha da unidade e Inadimplência por unidade

### Checklist de qualidade

- [x] Os itens marcados como concluídos foram revisados pela equipe
- [x] As funcionalidades entregues foram testadas: 1443 testes no backend (18 pulados) e 247 no frontend passam; mypy, lint, `tsc` e build sem erros; as telas novas foram conferidas no navegador — confirmar se foi feito teste com dados reais
- [x] O código está versionado no repositório com as alterações da sprint
- [x] Os problemas conhecidos estão registrados abaixo

### Problemas conhecidos

- As telas novas foram conferidas à mão no navegador; não há teste automático de tela.
- A migração do catálogo de sub-contas foi testada em banco de exemplo, não em cópia dos dados reais.
- O Asaas ainda não foi usado de verdade; a conta, o webhook e o pagamento confirmado dependem do sandbox.
- As specs 052 a 055 e 070 a 072 têm decisões marcadas como "a confirmar" que esperam o OK do cliente.
- O assistente de ajuda usa uma API de IA gratuita de terceiros: é preciso confirmar que nenhum dado pessoal sai do sistema antes de liberar para todos.
- O ISS da taxa de administração é só indicado, não calculado (o sistema não guarda a alíquota).

## 5. Retrospectiva da Sprint

### Manter

Especificar antes de construir e fechar cada fluxo de ponta a ponta (API, tela, testes e documentação), e medir antes de otimizar: o teste com dezenas de milhares de unidades e centenas de milhares de boletos achou problemas que os dados de exemplo escondiam.

### Melhorar

Duas pessoas numeraram specs e mexeram nas mesmas telas em branches diferentes: houve duas specs 056 e 057 e foi preciso reconciliar `dev` e `main` duas vezes. Combinar a numeração e manter uma única branch de integração reduz esse retrabalho.

### Agir

No início da próxima sprint, escolher uma única branch de integração com o Eduardo, reservar a numeração das specs e confirmar as decisões pendentes das specs 052 a 055 e 070 a 072.

## 6. Planejamento da próxima Sprint

### Meta da próxima Sprint

Colocar o sistema em uso real: ativar o backup na VPS, cadastrar um condomínio com dados verdadeiros, emitir um mês de ponta a ponta e validar o Asaas em sandbox.

### Itens inicialmente selecionados

| User Story ou item | Responsável(is), se definido(s) | Resultado esperado |
| --- | --- | --- |
| Ativar o backup na VPS e testar a restauração | Caio | Cópia diária funcionando e restauração comprovada |
| Cadastrar um condomínio real e emitir um mês | EQUIPE | Boletos de rascunho conferidos com a rotina real da administradora |
| Confirmar as decisões das specs 052 a 055 e 070 a 072 | Caio | Specs fechadas e condensadas no histórico |
| Teste do Asaas em sandbox | EQUIPE | Cobrança e pagamento confirmados |
| Concluir o assistente de ajuda e revisar a privacidade | Eduardo | Assistente liberado sem enviar dados pessoais |
| Validar o Financeiro com as telas reais do Sami | EQUIPE | Diferenças registradas e ajustes priorizados |

> Esta é uma seleção inicial. O planejamento poderá ser ajustado no início da próxima sprint.

### Riscos ou impedimentos previstos

O teste do Asaas foi adiado: sem ele, o registro do boleto e a baixa automática seguem sem prova. Sem o backup ativo na VPS, não é seguro lançar dados reais. E, se as telas reais do Sami continuarem sem validação, partes do Financeiro e da Cobrança podem precisar de ajuste.
