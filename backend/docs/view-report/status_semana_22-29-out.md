---
summary: Weekly overview (2026-10-22 to 2026-10-29), in Portuguese, built from the git history: what Caio and Eduardo delivered, quality, branch state and what is left.
read-when: you need the numbers and the split of the work between the two developers in that week
skip-if: you need the report in the sprint template → view-report/status_sprint_4.md; what is done or comes next → roadmap/README.md
---
# Status report — semana de 22 a 29/10/2026

ERP da EVE Administradora de Imóveis. Relatório feito a partir do histórico do git (`origin/dev` e `origin/main`), dos testes rodados hoje e das specs.

## Resumo em cinco linhas

- O **fluxo de cobrança ficou completo no código**: Inclusão de valores, tarifa de registro, boleto extra, descontos (valores negativos) e emissão do mês.
- Entraram os **relatórios** de Inadimplência e Prestação de contas (tela + PDF) e o **catálogo único de sub-contas** da administradora.
- A **interface foi refeita**: menu lateral com modal por módulo, cadastro de condomínios e unidades por condomínio.
- **Qualidade:** 1103 testes no backend e 95 no frontend passando; mypy, lint, `tsc` e build limpos na `dev`.
- **Falta validar com dados reais.** O Asaas (sandbox) foi adiado, o backup na VPS ainda não foi ativado e 4 specs esperam a sua confirmação.

## Números da semana

| | Caio | Eduardo |
|---|---|---|
| Commits (sem merges) | 41 | 54 |
| Linhas adicionadas / removidas* | ~14 mil / ~2,1 mil | ~27 mil / ~12,5 mil |
| Arquivos tocados* | 351 | 878 |

\* Sem o cliente de API gerado (`lib/api/generated`). Os números do Eduardo estão inflados porque, em 27/10, ele reaplicou na branch dele cerca de 10 commits de cobrança que eu já tinha feito (specs 037–040: conta única do Asaas, tarifa, Inclusão de valores, código de sub-conta, backup). Esses commits contam nas duas colunas. Os arquivos grandes dele também incluem a reorganização do backend. Os números mostram esforço, não valor entregue.

## O que o Caio entregou

**Cobrança e financeiro (backend e frontend)**
- Conta **única do Asaas por empresa**, no lugar de uma subconta por condomínio (spec 037).
- **Tarifa de registro** como evento da imobiliária, creditada na conta própria dela e nunca no condomínio (spec 038).
- **Inclusão de valores:** eventos e lançamentos que entram no boleto do mês, com rateio individual, coletivo ou por fração. Também entrou o código em cada sub-conta (spec 039).
- **Backup** criptografado do banco, toda noite, para um bucket R2 privado (spec 040). O código está pronto, mas **não foi ativado na VPS**.
- **Lançamento manual** sem justificativa e sem unidade obrigatórias (spec 051).
- **Relatórios** de Inadimplência e Prestação de contas na tela e em PDF (spec 052). A Ficha da unidade e a Taxa de administração ainda estão "Em breve".
- **Catálogo de sub-contas da administradora** (spec 053): código e nome definidos uma vez, e cada condomínio usa as que quiser. A migração que une as sub-contas antigas por nome foi testada em banco de exemplo.
- **Boleto extra** (spec 054): boleto avulso fora da emissão do mês, para uma ou mais unidades, com vencimento próprio, tarifa de registro opcional e relatório das unidades que ficaram de fora.
- **Descontos** (spec 055): valor negativo nos lançamentos e no extra. O total do boleto nunca fica abaixo da tarifa e não existe desconto sobre ela. O desconto pago vira débito na sub-conta.

**Interface**
- Novo **shell** do app: menu lateral com modal de módulos em duas colunas, índice de seções à direita e tema escuro, mantendo o modo, o destaque e a fonte de Configurações (spec 049).
- **Cadastro de condomínios e de unidades:** escolhe-se o condomínio, abrem-se as unidades dele e há um botão para cadastrar (spec 050).

**Operação**
- Script `local-up.ps1` para subir tudo no Windows, com várias correções de portas e Docker.
- S3 local para o PDF funcionar em desenvolvimento.
- Sobrenome do administrador removido do login, dos docs e dos exemplos.

## O que o Eduardo entregou

**Backend (arquitetura)**
- **Módulos de pessoa**: a tabela `PersonModuleMembership` substitui uma tabela por módulo (specs 038 e 040 dele, numeração dele).
- Peças compartilhadas movidas para `core/infrastructure`: busca por `?query=`, `Address` em `core`, cálculo das regras de cobrança e juros movidos para `billing` e integrações agrupadas em `billing/infrastructure`.
- **Critérios de rateio nomeados**, uma linha de fração por unidade, e renomeações de modelos (`CondominiumAdministrationContract` e outras).
- Estrutura de `seed` própria e dashboard dividido por seção.
- Muita limpeza: testes podados, imports ordenados, validadores dentro dos modelos.

**Frontend**
- Renderização do ERP no cliente, com o shell pré-renderizado.
- **Páginas de marketing e login:** landing nova com globo e pilha de telas, prédio de partículas no login.
- **Cadastro de condomínios:** workspace mestre-detalhe com as seções de cada condomínio, listas redesenhadas, barra de rodapé dos formulários e resumo de erros que abre seções fechadas.
- **Mobile:** UX do painel no celular e botão de voltar nas telas de unidade.
- Trouxe o shell, o cadastro e o workspace de unidades da `main` para a branch dele.

## Qualidade

| Verificação | Resultado |
|---|---|
| Backend (`pytest apps`) | **1103 passam** |
| `mypy apps` | sem erros |
| `makemigrations --check`, `manage.py check` | limpos |
| Frontend `pnpm test` | **95 passam** |
| `pnpm lint --max-warnings=0`, `tsc`, `pnpm build` | limpos |
| Docs (`check_docs.py`) | ok |
| Telas no navegador (Playwright, manual) | Boleto extra, documentos e lançamento com desconto conferidos |

**Não coberto por testes automáticos:** as telas novas (só conferência manual). O upgrade de um banco antigo (a migração do catálogo foi testada em banco de exemplo, não em cópia dos dados reais). Nunca falamos com o Asaas de verdade.

## Estado dos branches (atenção)

- `dev` tem **7 commits que a `main` não tem**. São o catálogo de sub-contas, os relatórios, o boleto extra e os descontos.
- `main` tem **11 commits do Eduardo que a `dev` não tem**. São os PRs #34 a #38: landing e login, redesign das listas do cadastro, UX mobile, botão de voltar nas unidades e o README.
- Os dois lados mexem no frontend do cadastro de condomínios e no shell. **Antes de subir a `dev` para a `main`, é preciso reconciliar**. Ele também voltou a dizer "tema claro único" em um commit e "dark/system" em outro, e isso precisa ser alinhado com o sistema de modo e cor das Configurações.
- Combinado anterior: "o que vale é a nossa branch". O Eduardo precisa zerar a `main` local dele.

## Decisões que esperam a sua confirmação

Estão marcadas como "agent, to be confirmed" nas specs.

| Spec | O que precisa do seu OK |
|---|---|
| 052 Relatórios | critérios de inadimplência e de movimento da prestação de contas |
| 053 Catálogo | regras de código automático, nome único sem diferença de maiúscula e fusão por nome na migração |
| 054 Boleto extra | divisão só entre as unidades emitidas, síndico não isento, unidade bloqueada pulada |
| 055 Descontos | desconto como débito na sub-conta, unidade com o mesmo sinal do lançamento, plano só positivo |
| 037–039 | decisões abertas desde antes, mais uso com dados reais |

## O que falta

1. **Backup na VPS:** criar o bucket R2 e a senha, publicar, rodar uma vez e fazer o teste de restauração. É o item mais importante antes de usar dados reais.
2. **Asaas em sandbox:** adiado por você. Faltam a chave, o webhook, uma cobrança e um pagamento confirmado.
3. **Relatórios** Ficha da unidade e Taxa de administração.
4. **Reconciliar `dev` e `main`** e alinhar o tema com o Eduardo.
5. **Uso com dados reais:** cadastrar condomínios, unidades, pessoas, sub-contas e planos e emitir um mês de verdade.
6. **Testes automáticos de tela** para as telas novas, se quiser cobertura além da conferência manual.
7. **Reversão de um lançamento da imobiliária** em caso de estorno, e o caixa da administradora (pagamento no balcão sem tarifa), cada um com a própria spec.

## Para ficar claro

- Os números de commits e linhas vêm do git e **não medem valor entregue**.
- Parte do que o Eduardo fez em 27/10 repete o que eu tinha feito, por causa das duas linhas de histórico.
- Este arquivo não faz parte do índice de docs do projeto e **não foi commitado**.
