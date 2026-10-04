import type { Metadata } from "next";

import { AsciiBuilding } from "./_components/AsciiBuilding";
import { LoginForm } from "./_components/LoginForm";
import { ShellFrame } from "./_components/ShellFrame";

export const metadata: Metadata = { title: "Entrar" };

/** Server Component: só o conteúdo estático; a interação fica no `LoginForm`. */
export default function LoginPage() {
  return (
    <ShellFrame className="flex flex-col items-center justify-center">
      <main className="w-full max-w-xs">
        <AsciiBuilding className="mx-auto mb-8 w-fit" />

        <header className="text-center">
          <h1 className="text-title">ERP Imobiliária</h1>
          <p className="mt-1.5 text-body text-ink-soft">Entre para continuar.</p>
        </header>

        <LoginForm />
      </main>

      <p className="mt-12 text-center text-caption text-ink-faint">EVE Administradora de Imóveis</p>
    </ShellFrame>
  );
}
