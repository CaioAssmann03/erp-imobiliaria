import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MODULE_SLUGS, type ModuleSlug } from "@/lib/site/public-pages";
import { pageMetadata } from "@/lib/site/page-metadata";

import { MODULE_PAGES } from "@/app/(marketing)/_components/content";
import { ModuleOutro } from "@/app/(marketing)/_components/sections/ModuleOutro";
import { AssistenteStory } from "@/app/(marketing)/_components/story/AssistenteStory";
import { CobrancasStory } from "@/app/(marketing)/_components/story/CobrancasStory";
import { CondominiumStory } from "@/app/(marketing)/_components/story/CondominiumStory";
import { LancamentosStory } from "@/app/(marketing)/_components/story/LancamentosStory";

const isModule = (slug: string): slug is ModuleSlug => (MODULE_SLUGS as readonly string[]).includes(slug);

export function generateStaticParams() {
  return MODULE_SLUGS.map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!isModule(slug)) return {};
  const page = MODULE_PAGES[slug];
  return pageMetadata({ title: page.title, description: page.lead, path: `/features/${slug}` });
}

export default async function ModulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isModule(slug)) notFound();

  return (
    <>
      {/* Cada módulo tem a sua landing, diferente das outras. */}
      {slug === "condominios" ? (
        <CondominiumStory />
      ) : slug === "lancamentos" ? (
        <LancamentosStory />
      ) : slug === "cobrancas" ? (
        <CobrancasStory />
      ) : (
        <AssistenteStory />
      )}
      <ModuleOutro slug={slug} />
    </>
  );
}
