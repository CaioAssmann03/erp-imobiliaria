import { cookies } from "next/headers";
import Link from "next/link";

import { Brand } from "@/components/Brand";
import { GlobalSearch } from "./GlobalSearch";
import { MobileMenu } from "./MobileMenu";
import { Sidebar } from "./Sidebar";
import { parseAppearance } from "@/lib/appearance";
import { SIDEBAR_COOKIE } from "@/lib/auth";

/**
 * Server Component: lê o estado da lateral e o tema (cookies) e monta o esqueleto.
 *
 * Desktop (lg+): lateral (marca + navegação) sobre o fundo e, à direita, a moldura
 * arredondada com a busca centralizada e as páginas.
 * Celular: tela inteira, sem moldura. Barra fixa no topo (menu lateral, marca, busca); a navegação, as configurações e o sair ficam no
 * menu lateral.
 */
export async function AppShell({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sidebarOpen = cookieStore.get(SIDEBAR_COOKIE)?.value !== "0";
  const appearance = parseAppearance((name) => cookieStore.get(name)?.value);

  return (
    <div className="min-h-screen bg-shell lg:bg-transparent lg:p-4">
      <div className="flex min-h-screen flex-col lg:min-h-[calc(100vh-2rem)] lg:flex-row lg:gap-4">
        <Sidebar defaultOpen={sidebarOpen} appearance={appearance} />

        <div className="min-w-0 flex-1 bg-shell lg:rounded-shell lg:p-5">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-2 bg-shell/90 px-4 backdrop-blur-md lg:static lg:mb-6 lg:h-auto lg:justify-center lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
            <MobileMenu appearance={appearance} />
            <Link href="/" className="lg:hidden">
              <Brand />
            </Link>
            <div className="ml-auto flex items-center gap-0.5 lg:ml-0 lg:w-full lg:max-w-xl">
              <div className="lg:w-full">
                <GlobalSearch />
              </div>
            </div>
          </header>

          <main className="px-4 pt-2 pb-8 lg:p-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
