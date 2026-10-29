import type { Metadata } from "next";
import Link from "next/link";

import { CONTACT_HREF } from "@/app/(marketing)/_components/content";

import { LoginForm } from "./_components/LoginForm";
import { ParticleLogo } from "./_components/ParticleLogo";

export const metadata: Metadata = { title: "Entrar" };

/**
 * Server Component: só o conteúdo estático; a interação fica no `LoginForm`. O cabeçalho vem do `layout.tsx`. A tela é
 * dividida ao meio, abaixo do cabeçalho: à esquerda o formulário, numa coluna estreita e centrada na altura (título, uma
 * linha de apoio, os dois campos e o botão, com o convite para criar conta separado por um fio); à direita (só no
 * desktop) um painel emoldurado, mais claro, com o logo de partículas. No celular fica só o formulário.
 */
export default function LoginPage() {
  return (
    <main className="relative z-10 grid min-h-screen lg:grid-cols-2 lg:p-3 lg:pt-16">
      <section className="flex items-center justify-center px-6 pt-16 pb-10 lg:pt-0 lg:pb-0">
        <div className="w-full max-w-[22rem]">
          <h1 className="font-display text-title">Entrar</h1>
          <p className="mt-1.5 text-body text-ink-soft">Use o usuário e a senha da sua administradora.</p>

          <div className="mt-7">
            <LoginForm />
          </div>

          <p className="mt-6 border-t border-ink/10 pt-5 text-body text-ink-soft">
            Ainda não tem conta?{" "}
            <Link href={CONTACT_HREF} className="font-medium text-ink underline underline-offset-4">
              Criar conta
            </Link>
          </p>
        </div>
      </section>

      <aside className="hidden items-center justify-center overflow-hidden border border-ink/10 bg-shell lg:flex">
        <ParticleLogo />
      </aside>
    </main>
  );
}
