import Link from "next/link";

import { Brand } from "@/components/Brand";
import { GlobalSearch } from "./GlobalSearch";
import { MobileMenu } from "./MobileMenu";
import { Rail } from "./Rail";

/**
 * Server Component sem dados nem cookies (o mesmo HTML para todos): monta o esqueleto. O tema vem de atributos do <html>
 * (ver `APPEARANCE_INIT_SCRIPT`).
 *
 * Desktop (lg+): a rail de ícones à esquerda (cada módulo abre seu cartão de menu) e, ao lado, a área de conteúdo com a busca no topo.
 * Celular: tela inteira. Barra fixa no topo (menu lateral, marca, busca); a navegação, as configurações e o sair ficam no menu lateral.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas lg:flex">
      <Rail />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col bg-shell">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 bg-shell/90 px-4 backdrop-blur-md lg:h-16 lg:justify-center lg:px-8">
          <MobileMenu />
          <Link href="/dashboard" className="lg:hidden">
            <Brand />
          </Link>
          <div className="ml-auto flex items-center gap-0.5 lg:ml-0 lg:w-full lg:max-w-xl">
            <div className="lg:w-full">
              <GlobalSearch />
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 pt-2 pb-8 lg:px-8 lg:pt-6">{children}</main>
      </div>
    </div>
  );
}
