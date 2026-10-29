import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { CONTACT_HREF } from "@/app/(marketing)/_components/content";

import { ParticleSkyscraper } from "./_components/ParticleSkyscraper";
import { LoginForm } from "./_components/LoginForm";

export const metadata: Metadata = { title: "Entrar" };

/**
 * Server Component: só o conteúdo estático; a interação fica no `LoginForm`. O cabeçalho vem do `layout.tsx`. O formulário
 * e o prédio de partículas ficam lado a lado, próximos e juntos no centro da tela: à esquerda, uma coluna estreita com um
 * link discreto de volta ao início, o título curto, uma linha de apoio, os campos (planos, sem cartão) e o convite para
 * criar conta; à direita (só no desktop), o prédio inteiro à vista. No celular fica só o formulário.
 */
export default function LoginPage() {
  return (
    <main className="relative z-10 flex min-h-screen items-center justify-center px-6 pt-24 pb-12">
      <div className="grid w-full max-w-sm items-center gap-12 lg:w-auto lg:max-w-none lg:grid-cols-[24rem_auto] lg:gap-16">
        <section className="w-full">
          <Link href="/" className="inline-flex items-center gap-1.5 text-label text-ink-faint transition-colors hover:text-ink">
            <ArrowLeft className="size-3.5" />
            Voltar ao início
          </Link>

          <h1 className="mt-10 font-display text-section font-bold tracking-[-0.03em]">Entrar</h1>
          <p className="mt-2 text-body text-ink-soft">Use o usuário e a senha da sua administradora.</p>

          <div className="mt-9">
            <LoginForm />
          </div>

          <p className="mt-10 text-body text-ink-soft">
            Ainda não tem conta?{" "}
            <Link href={CONTACT_HREF} className="font-medium text-ink underline underline-offset-4">
              Criar conta
            </Link>
          </p>
        </section>

        <div className="hidden lg:block">
          <ParticleSkyscraper />
        </div>
      </div>
    </main>
  );
}
