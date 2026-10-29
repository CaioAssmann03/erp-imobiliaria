# Status Report da Sprint 3 — ERP Imobiliária

## 1. Identificação

- **Projeto:** ERP Imobiliária
- **Número da Sprint:** 4 (parcial: dados até 29/10)
- **Período:** 23/10 a 05/11/2026 (relatório parcial, até 29/10)
- **Integrantes:** Gabriel Tadeu Matiolla, Caio Assmann, Eduardo Paim, Raquel Aguilhera
- **Scrum Master da Sprint:**

### Meta da Sprint

Fechar o fluxo de cobrança do condomínio — tarifa de registro, Inclusão de valores, boleto extra e descontos —, entregar os primeiros relatórios (Inadimplência e Prestação de contas) e renovar a interface do ERP (menu lateral, cadastro de condomínios e de unidades).

## 2. Resultado da Sprint

### Situação da meta

- [ ] Alcançada
- [x] Parcialmente alcançada
- [ ] Não alcançada

### Resultado alcançado

O fluxo de cobrança ficou completo no código e a interface foi refeita. Entregas até 29/10:

- **Boleto extra** — boleto avulso, fora da emissão do mês, para uma ou mais unidades, com vencimento próprio e tarifa de registro opcional; a tela mostra os boletos emitidos e as unidades que ficaram de fora, com o motivo
- **Descontos** — valores negativos na Inclusão de valores e no boleto extra; o total nunca fica abaixo da tarifa de registro e a tarifa nunca recebe desconto; o desconto pago vira débito na sub-conta
- **Inclusão de valores e tarifa de registro** — lançamentos individuais, coletivos ou por fração entram no boleto do mês; a tarifa de R$ 3,90 é crédito da imobiliária e nunca do condomínio
- **Conta única do Asaas por empresa** — no lugar de uma subconta por condomínio
- **Catálogo único de sub-contas da administradora** — código e nome definidos uma vez; cada condomínio usa as que quiser
- **Relatórios** de **Inadimplência** e **Prestação de contas**, na tela e em PDF
- **Backup** criptografado do banco, toda noite, para um bucket privado (código pronto, falta ativar na VPS)
- **Nova interface** — menu lateral com modal por módulo, cadastro de condomínios (lista, seções e menu lateral por condomínio) e cadastro de unidades por condomínio; versão para celular do painel
- **Arquitetura do backend** — módulos de pessoa em uma só tabela, peças compartilhadas em `core`, critérios de rateio nomeados e uma linha de fração por unidade
- **Site público** — landing e login novos

### Principal dificuldade ou impedimento

O que foi feito ainda não foi usado com dados reais: o Asaas não foi testado em sandbox (adiado).

## 3. Itens planejados e situação final

| User Story ou item | Responsável(is) | Situação final | Observação |
| --- | --- | --- | --- |
| Boleto extra (spec 054) | Caio | Concluído | API e tela; aguarda confirmação de 4 decisões |
| Descontos — valores negativos (spec 055) | Caio | Concluído | Total não pode ficar abaixo da tarifa; desconto pago vira débito |
| Inclusão de valores e tarifa de registro (specs 038 e 039) | Caio | Concluído | Em uso apenas em ambiente de teste |
| Conta única do Asaas por empresa (spec 037) | Caio | Concluído | Falta validar em sandbox |
| Catálogo de sub-contas da administradora (spec 053) | Caio | Concluído | Migração dos dados antigos testada em banco de exemplo |
| Relatórios de Inadimplência e Prestação de contas (spec 052) | Caio | Concluído | Ficha da unidade e Taxa de administração seguem "Em breve" |
| Backup criptografado do banco (spec 040) | Caio | Em andamento | Código pronto; falta bucket, senha, publicação e teste de restauração |
| Nova interface: menu lateral, cadastro de condomínios e de unidades | Caio e Eduardo | Concluído | Duas linhas de trabalho reconciliadas na `dev` |
| UX para celular e landing e login novos | Eduardo | Concluído | Tema claro/escuro a alinhar |
| Reorganização do backend e módulos de pessoa | Eduardo | Concluído | Specs 038 a 044 da numeração dele |
| Validar o Financeiro com as telas reais do Sami | EQUIPE | A confirmar | Pendente desde a Sprint 2 |
| Teste do Asaas em sandbox | EQUIPE | Não iniciado | Adiado pelo cliente; as outras regras de negócio vieram antes |
| Relatórios Ficha da unidade e Taxa de administração | — | Não iniciado | Próxima prioridade dos relatórios |

## 4. Evidências e qualidade

### Evidências

- **Repositório:** https://github.com/CaioAssmann03/erp-imobiliaria.git
- **Quadro Kanban:** https://trello.com/b/DSNUcHd1/erp-imobiliaria
- **Deploy ou instruções para executar o projeto:** https://erp.177-7-63-175.sslip.io/
- **Outras evidências:** commits da semana na branch `dev` (PRs #34 a #38 do Eduardo na `main`); prints das telas Boleto extra, documentos com a etiqueta "Extra", lançamento com desconto, nova sub-conta e relatórios

### Checklist de qualidade

- [x] Os itens marcados como concluídos foram revisados pela equipe
- [x] As funcionalidades entregues foram testadas: 1103 testes no backend e 98 no frontend passam; mypy, lint, `tsc` e build sem erros; as telas novas foram conferidas no navegador — confirmar se foi feito teste com dados reais
- [x] O código está versionado no repositório com as alterações da sprint
- [x] Os problemas conhecidos estão registrados abaixo

### Problemas conhecidos

- As telas novas foram conferidas à mão no navegador; não há teste automático de tela.
- A migração do catálogo de sub-contas foi testada em banco de exemplo, não em cópia dos dados reais.
- O Asaas ainda não foi usado de verdade; a conta, o webhook e o pagamento confirmado dependem do sandbox.
- As specs 052 a 055 têm decisões marcadas como "a confirmar" que esperam o OK do cliente.
- Os relatórios Ficha da unidade e Taxa de administração ainda não existem.

## 5. Retrospectiva da Sprint

### Manter

Especificar antes de construir e fechar cada fluxo de ponta a ponta (API, tela, testes e documentação): o boleto extra e os descontos já nasceram usando as regras de Inclusão de valores, sem duplicar código.

### Melhorar

Duas pessoas mexeram na mesma interface em branches diferentes e parte do trabalho se repetiu; foi preciso reconciliar `dev` e `main` no fim. Combinar antes quem mexe em quê e manter uma única branch de integração reduz esse retrabalho.

### Agir

No início da próxima sprint, alinhar com o Eduardo a branch de integração e o tema (claro/escuro) e confirmar as decisões pendentes das specs 052 a 055.

## 6. Planejamento da próxima Sprint

### Meta da próxima Sprint

Colocar o sistema em uso real: ativar o backup na VPS, cadastrar um condomínio com dados verdadeiros, emitir um mês de ponta a ponta e entregar os relatórios restantes.

### Itens inicialmente selecionados

| User Story ou item | Responsável(is), se definido(s) | Resultado esperado |
| --- | --- | --- |
| Ativar o backup na VPS e testar a restauração | Caio | Cópia diária funcionando e restauração comprovada |
| Cadastrar um condomínio real e emitir um mês | EQUIPE | Boletos de rascunho conferidos com a rotina real da administradora |
| Confirmar as decisões das specs 052 a 055 | Caio | Specs fechadas e condensadas no histórico |
| Relatórios Ficha da unidade e Taxa de administração | Caio | Duas telas novas, com PDF |
| Alinhar tema e branch de integração com o Eduardo | Caio e Eduardo | `dev` e `main` sem divergência |
| Teste do Asaas em sandbox | EQUIPE | Cobrança e pagamento confirmados |

> Esta é uma seleção inicial. O planejamento poderá ser ajustado no início da próxima sprint.

### Riscos ou impedimentos previstos

O teste do Asaas foi adiado: sem ele, o registro do boleto e a baixa automática seguem sem prova. Sem o backup ativo na VPS, não é seguro lançar dados reais. E, se as telas reais do Sami continuarem sem validação, partes do Financeiro e da Cobrança podem precisar de ajuste.
