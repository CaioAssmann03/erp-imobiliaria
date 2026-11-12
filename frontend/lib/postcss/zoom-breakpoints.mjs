/**
 * Plugin PostCSS (roda depois do Tailwind): faz os pontos de quebra (`sm:`, `md:`, `lg:`, `xl:`, `max-*:`…) acompanharem o
 * tamanho do texto escolhido em Configurações → Acessibilidade.
 *
 * O tamanho do texto muda o `font-size` do <html>, e `rem` em media query não acompanha isso: ele sempre vale 16px. Sem este
 * plugin, em 125% a tela de 1280px tem só 1024px "de rem" de espaço útil, mas `lg:`/`xl:` seguem ligados como se tivesse 1280px,
 * e as três colunas dos cadastros espremem o formulário. Aqui cada `@media` de largura em rem vira três cópias, uma por tamanho
 * de texto, com o limite multiplicado pelo fator (112,5% e 125%) e os seletores escopados por `:where(html[data-text=…])`
 * (`:where` não soma especificidade, então a cascata continua a mesma). O resultado é o do zoom do navegador: aumentar o texto
 * troca para o layout de uma tela menor.
 *
 * Fica de fora, sem mudar, o `@media` que tem regra escrita à mão sobre `html`/`:root` (ex.: os campos de 16px no celular).
 * Os fatores espelham `html[data-text]` em `app/globals.css`.
 */
const SCALES = [
  { scope: ':where(html:not([data-text="large"]):not([data-text="xlarge"]))', factor: 1 },
  { scope: ':where(html[data-text="large"])', factor: 1.125 },
  { scope: ':where(html[data-text="xlarge"])', factor: 1.25 },
];

/** Um limite de largura em rem: `(width >= 64rem)`, `(min-width: 64rem)`, `(width < 64rem)`… */
const WIDTH_REM = /(width\s*(?:>=|<=|>|<)\s*|(?:min|max)-width\s*:\s*)([\d.]+)rem/g;

const hasWidthRem = (params) => new RegExp(WIDTH_REM.source).test(params);
const isMedia = (node) => node.type === "atrule" && node.name === "media";

function scaleParams(params, factor) {
  return params.replace(WIDTH_REM, (_, head, value) => `${head}${Number((Number(value) * factor).toFixed(4))}rem`);
}

/** `@media` mais externo com largura em rem (o que está dentro dele é tratado junto com ele). */
function isOutermostWidthMedia(node) {
  if (!isMedia(node) || !hasWidthRem(node.params)) return false;
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (isMedia(parent) && hasWidthRem(parent.params)) return false;
  }
  return true;
}

function rulesOf(media) {
  const rules = [];
  media.walkRules((rule) => {
    // Regras dentro de @keyframes têm seletores como `from`/`50%`: não são seletores de elemento.
    if (rule.parent?.type === "atrule" && /keyframes$/i.test(rule.parent.name)) return;
    rules.push(rule);
  });
  return rules;
}

const targetsRoot = (rule) => rule.selectors.some((selector) => /^(html|:root|\*|body)\b/.test(selector.trim()) || selector.trim() === "*");

const plugin = () => ({
  postcssPlugin: "zoom-breakpoints",
  OnceExit(root) {
    const medias = [];
    root.walkAtRules("media", (node) => {
      if (isOutermostWidthMedia(node)) medias.push(node);
    });

    for (const media of medias) {
      if (rulesOf(media).some(targetsRoot)) continue;

      const copies = SCALES.map(({ scope, factor }) => {
        const copy = media.clone();
        copy.params = scaleParams(copy.params, factor);
        copy.walkAtRules("media", (inner) => {
          inner.params = scaleParams(inner.params, factor);
        });
        for (const rule of rulesOf(copy)) {
          rule.selectors = rule.selectors.map((selector) => `${scope} ${selector}`);
        }
        return copy;
      });

      // As três cópias ficam no lugar do original, na mesma ordem da cascata.
      for (const copy of copies) media.before(copy);
      media.remove();
    }
  },
});
plugin.postcss = true;

export default plugin;
