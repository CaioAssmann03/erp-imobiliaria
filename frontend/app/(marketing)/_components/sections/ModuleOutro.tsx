import Link from "next/link";

import type { ModuleSlug } from "@/lib/site/public-pages";

import { MODULE_LINKS } from "@/app/(marketing)/_components/content";

/** Para onde cada módulo leva no fim: Condomínios → Lançamentos → Cobranças → Assistente → Como funciona. */
const NEXT_STEP: Record<ModuleSlug, { href: string; label: string; summary: string }> = {
  condominios: MODULE_LINKS.find((link) => link.href === "/features/lancamentos")!,
  lancamentos: MODULE_LINKS.find((link) => link.href === "/features/cobrancas")!,
  cobrancas: MODULE_LINKS.find((link) => link.href === "/features/assistente")!,
  assistente: { href: "/how-it-works", label: "Como funciona", summary: "Configure uma vez e deixe o sistema cuidar da rotina mensal." },
};

/**
 * O fim da página de um módulo, o mais limpo possível: sem frase nem botão (a demonstração já está no rodapé), só uma linha
 * fina com a próxima página da sequência: o nome, o resumo e a seta que anda no hover.
 */
export function ModuleOutro({ slug }: { slug: ModuleSlug }) {
  const next = NEXT_STEP[slug];
  return (
    <section aria-label="Continue" className="mx-auto w-full max-w-2xl px-6 pt-24 pb-8 md:pt-32">
      <Link href={next.href} className="group flex items-center justify-between gap-6 border-t border-ink/15 pt-8">
        <span>
          <span className="block text-label text-ink-faint">Próximo</span>
          <span className="mt-2 block font-display text-title font-normal">{next.label}</span>
          <span className="mt-1 block text-sm text-ink-soft">{next.summary}</span>
        </span>
        <span
          aria-hidden
          className="shrink-0 text-xl text-ink-soft transition-all duration-300 group-hover:translate-x-1 group-hover:text-ink"
        >
          →
        </span>
      </Link>
    </section>
  );
}
