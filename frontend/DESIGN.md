# Design system

Fonte única: `app/globals.css` (tokens do Tailwind v4 em `@theme`). Os tokens do
shadcn (`--primary`, `--card`…) são mapeados para estes, então todo componente de
`components/ui` herda o sistema. **Não use hex, `text-sm`, `rounded-xl` etc. soltos.**

## Cores

| Token | Uso |
|---|---|
| `canvas` | fundo da página |
| `shell` | moldura arredondada que contém o app |
| `surface` | cards |
| `surface-muted` | painéis internos, inputs, cabeçalho de tabela |
| `surface-sunken` | hover de elementos sobre `surface-muted` |
| `ink` / `ink-soft` / `ink-faint` | texto principal / secundário / placeholder |
| `brand` (`-strong`, `-light`, `-soft`) | laranja da marca; use com parcimônia (1 destaque por tela, foco, links de ação) |
| `success` / `danger` / `warning` (+ `-soft`) | **somente** status |

Ação principal = botão `ink` (escuro). O laranja é destaque, não botão padrão
(existe `variant="brand"` para CTAs raros).

## Tipografia (Inter)

`text-display` 36 · `text-title` 24 · `text-heading` 16 · `text-body` 13 · `text-caption` 12.
Cada um já define line-height, tracking e peso. Números em destaque: `tabular-nums`.

## Forma

Raios: `rounded-shell` 28 · `rounded-card` 20 · `rounded-panel` 14 · `rounded-control` 12 · `rounded-full` (botões, nav, badges).
Sombras: `shadow-card` (repouso), `shadow-float` (elementos flutuantes).
**Sem linhas divisórias**: separe com espaço e superfícies (`surface-muted`), não com `border`.

## Componentes

- `Button` (`variant`: default · brand · secondary · ghost · destructive · link; `size`: default · sm · lg · icon) e `LinkButton` para links com aparência de botão.
- `Card`, `Badge` (success · danger · warning · brand · secondary), `Input`, `Table`.
- Do app: `AppShell`, `PageHeader`, `Metric`, `DataList` (`Toolbar`, `SearchField`, `NameCell`, `ListState`), `StatusBadge`, `ConfirmDeleteButton`.
- Formulários usam as classes de `lib/ui.ts` (também baseadas nos tokens).

## Densidade

Interface compacta, pensada para muitos campos: botões `h-8` (sm `h-7`), inputs `h-9`,
linhas de tabela `py-2`, cards com padding 20px, shell até `90rem`. Formulários usam
grade de até 3 colunas em telas largas.

## Vidro (liquid glass)

Usado só onde há sobreposição: `glass-pill` (botão de busca no header) e `glass` (painel do
Spotlight). Translúcido + blur + realce interno de 1px; definidos em `globals.css`.

## Busca e foco no painel

- `GlobalSearch`: Spotlight (⌘K). Resultados da API via TanStack Query (debounce 250 ms) +
  páginas/gráficos filtrados localmente (`lib/search-index.ts`).
- Cada card do painel é um *widget* (`DashboardWidgets.tsx`): o mesmo `render(large)` alimenta
  o card e o modal. Ao buscar um item do painel, navega para `/?foco=<id>` e o `FocusModal`
  abre o widget ampliado (voltar, Esc ou clique fora fecham). Novo widget = nova entrada em
  `WIDGET_IDS` + `buildWidgets` + `search-index`.

## Estrutura da página

`AppShell`: lateral à esquerda (marca, navegação vertical, "Sair" no rodapé) e, à direita, busca
centralizada no topo + conteúdo. Abaixo de `lg` a lateral vira uma faixa no topo com a navegação
rolável na horizontal. Novos módulos = novo item em `NavLinks`.
