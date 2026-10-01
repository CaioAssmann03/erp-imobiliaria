import { cookies } from "next/headers";

import { GlobalSearch } from "@/components/GlobalSearch";
import { Sidebar } from "@/components/Sidebar";
import { parseAppearance } from "@/lib/appearance";
import { SIDEBAR_COOKIE } from "@/lib/auth";

/**
 * Server Component: lê o estado da lateral (cookie) e monta o esqueleto.
 * A lateral (marca + navegação) fica direto sobre o fundo da página; o conteúdo
 * (busca centralizada + páginas) vive dentro da moldura arredondada `shell`.
 * Em telas estreitas a lateral vira uma faixa acima da moldura.
 */
export async function AppShell({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sidebarOpen = cookieStore.get(SIDEBAR_COOKIE)?.value !== "0";
  const appearance = parseAppearance((name) => cookieStore.get(name)?.value);

  return (
    <div className="min-h-screen p-2 md:p-4">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[96rem] flex-col gap-3 lg:flex-row lg:gap-4">
        <Sidebar defaultOpen={sidebarOpen} appearance={appearance} />

        <div className="min-w-0 flex-1 rounded-shell bg-shell p-3 md:p-5">
          <header className="mb-6 flex justify-center">
            <div className="w-full max-w-xl">
              <GlobalSearch />
            </div>
          </header>
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
